import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { diag, type RuleContext } from '../diag-helpers.js';
import type { Diagnostic } from '../../types.js';

export function ruleProjectLayout(ctx: RuleContext): Diagnostic[] {
  const projects = ctx.project.projects ?? [];
  const apps = projects.filter(
    (p) => p.projectType === undefined || p.projectType === 'application',
  );
  if (apps.length === 0) {
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
  const findings: Diagnostic[] = [];
  for (const app of apps) {
    const mainTs = join(app.sourceRoot, 'main.ts');
    if (!existsSync(mainTs)) {
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/project-layout',
            severity: 'info',
            category: 'hygiene',
            message: `Project "${app.name}" has no bootstrap entry at ${relative(ctx.project.root, mainTs)}.`,
            file: mainTs,
            line: 1,
            column: 1,
            suggestion: `Place the ${app.name} bootstrap code in main.ts under its source root.`,
          },
          findings.length,
        ),
      );
    }
  }
  return findings;
}

const TYPE_FOLDERS = ['components', 'directives', 'services', 'pipes', 'guards'];

export function ruleTypeBasedFolder(ctx: RuleContext): Diagnostic[] {
  const projects = ctx.project.projects ?? [];
  if (projects.length > 0) {
    for (const project of projects) {
      const rel = relative(project.sourceRoot, ctx.file);
      if (rel.startsWith('..')) {
        continue;
      }
      const segments = rel.split('/');
      const start = segments[0] === 'app' ? 1 : 0;
      const folder = segments[start];
      // Flag a type folder sitting at (or one level below) the app root of a
      // declared source root; deeper feature-local folders are fine.
      if (folder !== undefined && TYPE_FOLDERS.includes(folder) && segments.length - start <= 3) {
        return [typeBasedDiag(ctx, folder)];
      }
      return [];
    }
    return [];
  }
  const match = ctx.file.match(/\/src\/(.+)$/);
  if (!match?.[1]) {
    return [];
  }
  const segments = match[1].split('/');
  for (const segment of segments) {
    if (TYPE_FOLDERS.includes(segment) && segments.length <= 3) {
      return [typeBasedDiag(ctx, segment)];
    }
  }
  return [];
}

function typeBasedDiag(ctx: RuleContext, segment: string): Diagnostic {
  return diag({
    ruleId: 'angular-doctor/type-based-folder',
    severity: 'info',
    category: 'hygiene',
    message: `Type-based folder "src/**/${segment}" detected.`,
    file: ctx.file,
    line: 1,
    column: 1,
    suggestion: 'Organize by feature area instead of file type where practical.',
  });
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
