import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  findUnsupportedConfig,
  loadConfig,
  resolveHtmlReportPath,
  resolveReportPath,
} from '../config/load-config.js';
import { detectProject } from '../project/detect-project.js';
import { partitionByExtension, resolveScanFiles } from '../project/resolve-files.js';
import { buildHtmlReport } from '../report/html-report.js';
import { buildMarkdownReport } from '../report/markdown-report.js';
import { runBuiltinRules } from '../rules/registry.js';
import { runOxlint } from '../runners/run-oxlint.js';
import { runTemplateEslint } from '../runners/run-template-eslint.js';
import { calculateScore, summarizeDiagnostics } from '../score/calculate-score.js';
import type { ScanOptions, ScanProgress, ScanResult } from '../types.js';

function report(options: ScanOptions, progress: ScanProgress): void {
  options.onProgress?.(progress);
}

export async function runScan(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now();
  report(options, {
    phase: 'project',
    message: 'Finding the Angular project',
    completed: 0,
    total: 0,
    findings: 0,
    score: null,
  });
  const project = detectProject(options.cwd);
  if (!project) {
    throw new Error(
      'No Angular workspace detected. Looked for angular.json or nx.json in parent directories.',
    );
  }
  if (project.supportTier === 'unsupported') {
    throw new Error(
      `Angular Doctor needs Angular 15 or newer. Found Angular ${project.angularVersion ?? 'unknown'}.`,
    );
  }

  const fileConfig = loadConfig(project.root);
  const config = {
    ...fileConfig,
    ...options.config,
    rules: { ...fileConfig.rules, ...options.config?.rules },
  };
  report(options, {
    phase: 'files',
    message: 'Choosing which files to read',
    completed: 0,
    total: 0,
    findings: 0,
    score: null,
  });
  const resolved = await resolveScanFiles(project.root, { ...options, config });
  const files = project.focusRoot
    ? resolved.filter((f) => f === project.focusRoot || f.startsWith(`${project.focusRoot}/`))
    : resolved;
  const { typescript, html } = partitionByExtension(files);

  const skippedChecks: string[] = [];
  const unsupported = findUnsupportedConfig(project.root);
  if (unsupported) {
    skippedChecks.push(
      `${unsupported}: TypeScript config files are not loaded yet. Move these settings to angular-doctor.config.json or package.json#angularDoctor.`,
    );
  }
  if (!project.angularVersion) {
    skippedChecks.push(
      'Angular version could not be detected from package.json, so version-specific checks were skipped.',
    );
  }
  if (project.supportTier === 'compat') {
    skippedChecks.push(
      `Compat mode: modern checks off for Angular ${project.angularVersion ?? 'unknown'}. Rules needing newer Angular were skipped.`,
    );
  }
  const allFiles = [...new Set([...typescript, ...html])];
  report(options, {
    phase: 'rules',
    message: 'Checking components and templates',
    completed: 0,
    total: allFiles.length,
    findings: 0,
    score: null,
  });
  const builtin = runBuiltinRules(
    project,
    allFiles,
    config,
    (completed, file, partial) => {
      report(options, {
        phase: 'rules',
        message: 'Checking components and templates',
        completed,
        total: allFiles.length,
        file,
        findings: partial.length,
        score: calculateScore(partial),
      });
    },
    (message) => {
      skippedChecks.push(message);
    },
  );

  report(options, {
    phase: 'typescript',
    message: 'Checking TypeScript',
    completed: allFiles.length,
    total: allFiles.length,
    findings: builtin.length,
    score: calculateScore(builtin),
  });
  const oxlint = runOxlint(project.root, typescript);
  if (oxlint.skipped && oxlint.skipReason) {
    skippedChecks.push(oxlint.skipReason);
  }

  report(options, {
    phase: 'templates',
    message: 'Checking HTML templates',
    completed: allFiles.length,
    total: allFiles.length,
    findings: builtin.length + oxlint.diagnostics.length,
    score: calculateScore([...builtin, ...oxlint.diagnostics]),
  });
  const template = await runTemplateEslint(project.root, html, typescript);
  if (template.skipped && template.skipReason) {
    skippedChecks.push(template.skipReason);
  }

  const diagnostics = [...builtin, ...oxlint.diagnostics, ...template.diagnostics];
  const totals = summarizeDiagnostics(diagnostics);
  const score = calculateScore(diagnostics);
  report(options, {
    phase: 'score',
    message: 'Adding up the health score',
    completed: allFiles.length,
    total: allFiles.length,
    findings: diagnostics.length,
    score,
  });
  const durationMs = Math.round(performance.now() - started);

  const partial = {
    score,
    supportTier: project.supportTier,
    diagnostics,
    totals,
    project,
    skippedChecks,
    durationMs,
    filesScanned: allFiles.length,
    filesTotal: allFiles.length,
  };

  let reportPath: string | null = null;
  let htmlReportPath: string | null = null;
  const hasViolations = score < 100 || totals.error > 0 || totals.warning > 0 || totals.info > 0;
  const wantHtml = options.htmlReport === true || (config.reportFormats?.includes('html') ?? false);

  if (hasViolations) {
    report(options, {
      phase: 'report',
      message: 'Writing the report',
      completed: allFiles.length,
      total: allFiles.length,
      findings: diagnostics.length,
      score,
    });
    reportPath = resolveReportPath(project.root, config);
    const md = buildMarkdownReport(partial, project);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, md, 'utf8');
    if (wantHtml) {
      htmlReportPath = resolveHtmlReportPath(project.root, config);
      writeFileSync(htmlReportPath, buildHtmlReport(partial, project), 'utf8');
    }
  }

  return { ...partial, reportPath, htmlReportPath };
}
