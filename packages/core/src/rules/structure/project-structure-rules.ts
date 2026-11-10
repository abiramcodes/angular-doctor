import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { diag, type RuleContext } from '../diag-helpers.js';
import type { Diagnostic } from '../../types.js';

export function ruleProjectLayout(ctx: RuleContext): Diagnostic[] {
  const mainTs = join(ctx.project.root, 'src', 'main.ts');
  if (existsSync(mainTs)) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/project-layout',
      severity: 'info',
      category: 'hygiene',
      message: 'Expected bootstrap entry at src/main.ts.',
      file: mainTs,
      line: 1,
      column: 1,
      suggestion: 'Place application bootstrap code in src/main.ts.',
    }),
  ];
}

export function ruleTypeBasedFolder(ctx: RuleContext): Diagnostic[] {
  const match = ctx.file.match(/\/src\/(.+)$/);
  if (!match?.[1]) {
    return [];
  }
  const segments = match[1].split('/');
  for (const segment of segments) {
    if (['components', 'directives', 'services'].includes(segment) && segments.length <= 3) {
      return [
        diag({
          ruleId: 'angular-doctor/type-based-folder',
          severity: 'info',
          category: 'hygiene',
          message: `Type-based folder "src/**/${segment}" detected.`,
          file: ctx.file,
          line: 1,
          column: 1,
          suggestion: 'Organize by feature area instead of file type where practical.',
        }),
      ];
    }
  }
  return [];
}

export function ruleOneConceptPerFile(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const matches = ctx.content.match(/@Component\s*\(/g);
  const count = matches?.length ?? 0;
  if (count <= 1) {
    return [];
  }
  const lines = ctx.content.split('\n').length;
  if (lines < 40) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/one-concept-per-file',
      severity: 'warning',
      category: 'maintainability',
      message: `File declares ${count} @Component classes.`,
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: 'Split into separate files unless classes share one small concept.',
    }),
  ];
}

export function runProjectLayoutCheck(project: RuleContext['project']): Diagnostic[] {
  return ruleProjectLayout({
    project,
    file: join(project.root, 'src', 'main.ts'),
    content: '',
  });
}

export const PROJECT_STRUCTURE_RULES = [ruleTypeBasedFolder, ruleOneConceptPerFile] as const;
