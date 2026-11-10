import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { isNonRenderingFile } from '../../project/infer-naming-convention.js';
import { diag, isUnderSrc, type RuleContext } from '../diag-helpers.js';
import type { Diagnostic } from '../../types.js';

const GENERIC = new Set(['helpers', 'utils', 'common']);
const SKIPPED_SPEC = /(?:^|\/)(?:main|routes|.*\.config|.*\.routes)\.ts$/;

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function fileStem(file: string): string {
  const base = basename(file, '.ts');
  return base
    .replace(/\.component$/, '')
    .replace(/\.service$/, '')
    .replace(/\.directive$/, '');
}

export function ruleFileHyphenCase(ctx: RuleContext): Diagnostic[] {
  if (!isUnderSrc(ctx.file) || !/\.(ts|html|css)$/.test(ctx.file)) {
    return [];
  }
  const name = basename(ctx.file);
  if (name.endsWith('.spec.ts')) {
    return [];
  }
  if (/[A-Z_]/.test(name.replace(/\.(ts|html|css)$/, ''))) {
    return [
      diag({
        ruleId: 'angular-doctor/file-hyphen-case',
        severity: 'warning',
        category: 'hygiene',
        message: 'File name should use hyphens between words.',
        file: ctx.file,
        line: 1,
        column: 1,
        suggestion: 'Rename to kebab-case (for example user-profile.ts).',
      }),
    ];
  }
  return [];
}

export function ruleGenericFilename(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !isUnderSrc(ctx.file)) {
    return [];
  }
  const stem = basename(ctx.file, '.ts').replace(/\.(component|service|directive)$/, '');
  if (!GENERIC.has(stem)) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/generic-filename',
      severity: 'info',
      category: 'hygiene',
      message: `Overly generic file name "${stem}.ts".`,
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: 'Use a name that describes the code theme in this file.',
    }),
  ];
}

export function ruleMissingSpecFile(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || SKIPPED_SPEC.test(ctx.file) || !isUnderSrc(ctx.file)) {
    return [];
  }
  if (!/@Component\s*\(|@Directive\s*\(|@Pipe\s*\(/.test(ctx.content)) {
    return [];
  }
  const specPath = ctx.file.replace(/\.ts$/, '.spec.ts');
  if (existsSync(specPath)) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/missing-spec-file',
      severity: 'warning',
      category: 'hygiene',
      message: 'Testable Angular declaration has no sibling .spec.ts file.',
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: `Add ${basename(specPath)} next to this file.`,
    }),
  ];
}

export function ruleFilenameClassMismatch(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !isUnderSrc(ctx.file)) {
    return [];
  }
  const classMatch = ctx.content.match(/export\s+(?:default\s+)?class\s+(\w+)/);
  if (!classMatch?.[1]) {
    return [];
  }
  const className = classMatch[1];
  const expectedStem = pascalToKebab(className.replace(/Component$|Service$|Directive$|Pipe$/, ''));
  const actualStem = fileStem(ctx.file);
  if (expectedStem === actualStem || pascalToKebab(className) === actualStem) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/filename-class-mismatch',
      severity: 'warning',
      category: 'hygiene',
      message: `File stem "${actualStem}" does not match class "${className}".`,
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: `Prefer a file name like ${expectedStem}.ts for this class.`,
    }),
  ];
}

export function ruleComponentFileSetMismatch(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !/@Component\s*\(/.test(ctx.content)) {
    return [];
  }
  const useSuffix = ctx.naming?.mode === 'suffix' || ctx.file.includes('.component.ts');
  const dir = dirname(ctx.file);
  const stem = fileStem(ctx.file);
  const html = useSuffix ? join(dir, `${stem}.component.html`) : join(dir, `${stem}.html`);
  const hasInline = /template\s*:\s*`/.test(ctx.content) || /template\s*:\s*'/.test(ctx.content);
  if (hasInline) {
    return [];
  }
  if (existsSync(html)) {
    return [];
  }
  const alt = useSuffix ? join(dir, `${stem}.html`) : join(dir, `${stem}.component.html`);
  if (existsSync(alt)) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/component-file-set-mismatch',
      severity: 'warning',
      category: 'hygiene',
      message: 'Component is missing a matching template file with the same base name.',
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: `Add ${basename(html)} or use an inline template.`,
    }),
  ];
}

export function ruleNamingConventionMix(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !ctx.naming) {
    return [];
  }
  if (isNonRenderingFile(ctx.file) || !ctx.naming.renderingFiles.has(ctx.file)) {
    return [];
  }
  const dir = dirname(ctx.file);
  const dirMode = ctx.naming.dirModes.get(dir);
  if (dirMode !== 'mixed') {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/naming-convention-mix',
      severity: 'info',
      category: 'hygiene',
      message: 'This directory mixes .component.ts and suffixless component file names.',
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: 'Pick one naming style per feature folder for consistency.',
    }),
  ];
}

export const NAMING_RULES = [
  ruleFileHyphenCase,
  ruleGenericFilename,
  ruleMissingSpecFile,
  ruleFilenameClassMismatch,
  ruleComponentFileSetMismatch,
  ruleNamingConventionMix,
] as const;
