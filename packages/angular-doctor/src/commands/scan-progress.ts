import { relative } from 'node:path';
import { createColors } from 'picocolors';
import type { Diagnostic, ScanProgress, ScanResult, Severity } from '@angular-doctor/core/types';
import { colorize, type ColorRole } from './palette.js';

const BAR_WIDTH = 24;
const SCORE_BAR_WIDTH = 20;
const colorEnabled = process.stdout.isTTY === true || process.stderr.isTTY === true;
const pc = createColors(colorEnabled);

export function formatProgressLine(progress: ScanProgress, projectRoot: string): string {
  const total = Math.max(progress.total, progress.completed, 1);
  const filled = Math.min(BAR_WIDTH, Math.round((progress.completed / total) * BAR_WIDTH));
  const bar = `${'█'.repeat(filled)}${'░'.repeat(BAR_WIDTH - filled)}`;
  const count = progress.total > 0 ? `${progress.completed}/${progress.total} files` : 'looking';
  const file = progress.file ? `  ${shortPath(progress.file, projectRoot)}` : '';
  const score =
    progress.score === null
      ? 'score …'
      : colorize(`score ${progress.score}`, toneFor(progress.score));
  const findings = progress.findings === 1 ? '1 finding' : `${progress.findings} findings`;
  return `${colorize(bar, 'progress')}  ${count}  ${progress.message}  ${findings}  ${score}${file}`;
}

export function createScanView(projectRoot: string): {
  update: (progress: ScanProgress) => void;
  finish: (result: ScanResult) => Promise<void>;
} {
  const interactive = process.stderr.isTTY === true;
  let width = 0;
  if (interactive) {
    process.stderr.write('\x1b[?25l');
  }
  return {
    update(progress) {
      const line = formatProgressLine(progress, projectRoot);
      if (!interactive) {
        return;
      }
      const padded = line.padEnd(width);
      width = Math.max(width, visibleLength(line));
      process.stderr.write(`\r${padded}`);
    },
    async finish(result) {
      if (interactive) {
        process.stderr.write(`\r${' '.repeat(width)}\r`);
        await animateScore(result);
        process.stderr.write('\x1b[?25h');
      }
    },
  };
}

export function formatScoreSummary(result: ScanResult): string {
  const version = result.project.angularVersion?.split('.').slice(0, 2).join('.') ?? 'unknown';
  const header = pc.dim(
    `${result.project.name}  ·  Angular ${version}  ·  ${formatDuration(result.durationMs)}`,
  );
  const flagged = new Set(result.diagnostics.map((item) => item.file)).size;
  const counts = [
    colorize(`${result.filesScanned}/${result.filesTotal} files`, 'success'),
    pc.dim(`${flagged} with findings`),
    colorize(`${result.totals.error} errors`, 'error'),
    colorize(`${result.totals.warning} warnings`, 'warning'),
    colorize(`${result.totals.info} notes`, 'info'),
  ];
  if (result.skippedChecks.length > 0) {
    counts.push(pc.dim(`${result.skippedChecks.length} checks skipped`));
  }
  return `${header}\n${formatScoreMeter(result.score)}\n${counts.join(pc.dim('   '))}`;
}

export function formatReportLine(reportPath: string): string {
  return colorize(
    `Report: ${reportPath} (Cmd+click / Ctrl+click to open the file)`,
    'report',
    true,
  );
}

async function animateScore(result: ScanResult): Promise<void> {
  const frames = 12;
  let width = 0;
  for (let frame = 1; frame <= frames; frame += 1) {
    const shown = Math.round((result.score * frame) / frames);
    const line = formatScoreMeter(shown);
    const visible = visibleLength(line);
    width = Math.max(width, visible);
    process.stderr.write(`\r${line}${' '.repeat(width - visible)}`);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  process.stderr.write(`\r${' '.repeat(width)}\r`);
}

function formatScoreMeter(score: number): string {
  const tone = toneFor(score);
  return `${pc.dim('Health')}  ${colorize(scoreBar(score), tone)}  ${colorize(String(score), tone)}${pc.dim(' / 100')}`;
}

function scoreBar(score: number): string {
  const filled = Math.min(SCORE_BAR_WIDTH, Math.round((score / 100) * SCORE_BAR_WIDTH));
  return `${'█'.repeat(filled)}${'░'.repeat(SCORE_BAR_WIDTH - filled)}`;
}

function toneFor(score: number): ColorRole {
  if (score < 40) {
    return 'error';
  }
  if (score < 70) {
    return 'warning';
  }
  return 'success';
}

const GROUPS: { severity: Severity; title: string; role: ColorRole }[] = [
  { severity: 'error', title: 'Errors', role: 'error' },
  { severity: 'warning', title: 'Warnings', role: 'warning' },
  { severity: 'info', title: 'Info', role: 'info' },
];

export function printGroupedFindings(diagnostics: Diagnostic[], projectRoot: string): void {
  for (const group of GROUPS) {
    const items = diagnostics.filter((item) => item.severity === group.severity);
    if (items.length === 0) {
      continue;
    }
    console.log('');
    console.log(colorize(group.title.toLowerCase(), group.role) + pc.dim(`  ${items.length}`));
    for (const item of items) {
      console.log(formatFinding(item, projectRoot, group.role));
    }
  }
}

function formatFinding(item: Diagnostic, projectRoot: string, role: ColorRole): string {
  const rule = item.ruleId.replace(/^angular-doctor\//, '');
  const where = `${shortPath(item.file, projectRoot)}:${item.line}`;
  return `  ${colorize(rule, role)}  ${pc.dim(where)}\n  ${pc.dim(item.message)}`;
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  return `${(durationMs / 1000).toFixed(1)} s`;
}

function shortPath(file: string, projectRoot: string): string {
  const rel = relative(projectRoot, file);
  return rel.startsWith('..') ? file : rel;
}

function visibleLength(value: string): number {
  return value.replace(/\u001b\[[0-9;]*m/g, '').length;
}
