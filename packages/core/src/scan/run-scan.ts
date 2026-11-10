import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadConfig, resolveReportPath } from '../config/load-config.js';
import { detectProject } from '../project/detect-project.js';
import { partitionByExtension, resolveScanFiles } from '../project/resolve-files.js';
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

  const config = { ...loadConfig(project.root), ...options.config };
  report(options, {
    phase: 'files',
    message: 'Choosing which files to read',
    completed: 0,
    total: 0,
    findings: 0,
    score: null,
  });
  const files = await resolveScanFiles(project.root, { ...options, config });
  const { typescript, html } = partitionByExtension(files);

  const skippedChecks: string[] = [];
  const allFiles = [...new Set([...typescript, ...html])];
  report(options, {
    phase: 'rules',
    message: 'Checking components and templates',
    completed: 0,
    total: allFiles.length,
    findings: 0,
    score: null,
  });
  const builtin = runBuiltinRules(project, allFiles, config, (completed, file, partial) => {
    report(options, {
      phase: 'rules',
      message: 'Checking components and templates',
      completed,
      total: allFiles.length,
      file,
      findings: partial.length,
      score: calculateScore(partial),
    });
  });

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
  const template = await runTemplateEslint(project.root, html);
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
    diagnostics,
    totals,
    project,
    skippedChecks,
    durationMs,
    filesScanned: allFiles.length,
    filesTotal: allFiles.length,
  };

  let reportPath: string | null = null;
  const hasViolations = score < 100 || totals.error > 0 || totals.warning > 0 || totals.info > 0;

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
  }

  return { ...partial, reportPath };
}
