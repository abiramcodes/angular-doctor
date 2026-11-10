import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, majorVersion, type RuleContext } from '../diag-helpers.js';

export function ruleLegacyInput(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 19 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  if (
    !/@Input\s*\(/.test(ctx.content) &&
    !/@Input\s*\n/.test(ctx.content) &&
    !/@Input\b/.test(ctx.content)
  ) {
    return [];
  }
  const index = ctx.content.search(/@Input\b/);
  if (index === -1) {
    return [];
  }
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-signal-input',
      migrationId: 'signal-input',
      severity: 'info',
      category: 'maintainability',
      message: '@Input decorator found. Prefer signal-based input() API.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run signal-input-migration; verify public API compatibility.',
    }),
  ];
}

export function ruleLegacyOutput(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 19 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  const index = ctx.content.search(/@Output\b/);
  if (index === -1) {
    return [];
  }
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-output-fn',
      migrationId: 'output',
      severity: 'info',
      category: 'maintainability',
      message: '@Output decorator found. Prefer output() function API.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run output-migration for functional outputs and references.',
    }),
  ];
}

export function ruleLegacyQuery(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 19 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  const re = /@(ViewChild|ViewChildren|ContentChild|ContentChildren)\b/;
  const match = re.exec(ctx.content);
  if (!match) {
    return [];
  }
  const pos = lineFromIndex(ctx.content, match.index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-signal-query',
      migrationId: 'signal-queries',
      severity: 'info',
      category: 'maintainability',
      message: 'Decorator-based query found. Prefer signal query APIs.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run signal-queries-migration and re-run tests.',
    }),
  ];
}
