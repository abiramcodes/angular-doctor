import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, majorVersion, type RuleContext } from '../diag-helpers.js';

export function rulePreferInject(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const ctorMatch = ctx.content.match(/constructor\s*\(([^)]*)\)/s);
  if (!ctorMatch?.[1]?.trim()) {
    return [];
  }
  const params = ctorMatch[1];
  if (!/(private|protected|public|readonly)/.test(params)) {
    return [];
  }
  const index = ctx.content.indexOf('constructor');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-inject',
      migrationId: 'inject',
      severity: 'warning',
      category: 'maintainability',
      message:
        'Constructor parameter injection detected. Prefer the inject() function for dependencies.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run the inject() migration scoped with --path, then fix any manual edge cases.',
    }),
  ];
}

export function ruleNgModuleInModern(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 17 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  if (!/@NgModule\s*\(/.test(ctx.content)) {
    return [];
  }
  const index = ctx.content.indexOf('@NgModule');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-standalone',
      migrationId: 'standalone',
      severity: 'warning',
      category: 'correctness',
      message: '@NgModule found. Prefer standalone components and bootstrapApplication.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion:
        'Run the standalone migration in three CLI steps (convert, remove NgModules, bootstrap) with ng build between each.',
    }),
  ];
}

export function ruleStandaloneFalse(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 17 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  if (!/standalone\s*:\s*false/.test(ctx.content)) {
    return [];
  }
  const index = ctx.content.indexOf('standalone');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/standalone-false',
      migrationId: 'standalone',
      severity: 'warning',
      category: 'correctness',
      message: 'Component or directive explicitly sets standalone: false.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Use the standalone migration to convert declarations to standalone.',
    }),
  ];
}

export function ruleCommonModule(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  if (!/CommonModule/.test(ctx.content)) {
    return [];
  }
  const index = ctx.content.indexOf('CommonModule');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-common-imports',
      migrationId: 'common-to-standalone',
      severity: 'info',
      category: 'maintainability',
      message: 'CommonModule import detected. Prefer explicit standalone directive/pipe imports.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run common-to-standalone migration for minimal imports per template.',
    }),
  ];
}
