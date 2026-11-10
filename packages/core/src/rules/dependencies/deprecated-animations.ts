import { readFileSync } from 'node:fs';
import fg from 'fast-glob';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex } from '../diag-helpers.js';

const DOCS_URL = 'https://angular.dev/guide/legacy-animations';
const PACKAGE_NAME = '@angular/animations';
const SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

export function deprecatedAnimationsInPackageJson(text: string, file: string): Diagnostic[] {
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return [];
  }

  const listed = SECTIONS.some((section) => {
    const deps = pkg[section];
    return deps !== null && typeof deps === 'object' && PACKAGE_NAME in deps;
  });
  if (!listed) {
    return [];
  }

  const index = text.indexOf(`"${PACKAGE_NAME}"`);
  const pos = index >= 0 ? lineFromIndex(text, index) : { line: 1, column: 1 };
  return [
    diag({
      ruleId: 'angular-doctor/deprecated-animations',
      severity: 'error',
      category: 'maintainability',
      message: '`@angular/animations` is deprecated and still listed in package.json.',
      file,
      line: pos.line,
      column: pos.column,
      suggestion:
        'Remove the dependency. New animation code should use native CSS animate.enter and animate.leave.',
      docsUrl: DOCS_URL,
    }),
  ];
}

export function runDeprecatedAnimationsCheck(projectRoot: string): Diagnostic[] {
  const files = fg.sync('**/package.json', {
    cwd: projectRoot,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.angular/**'],
    dot: false,
  });
  const diagnostics: Diagnostic[] = [];
  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    diagnostics.push(...deprecatedAnimationsInPackageJson(text, file));
  }
  return diagnostics;
}
