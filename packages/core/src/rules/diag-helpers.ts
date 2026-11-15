import { getMigrationById } from '../migrations/registry.js';
import type { AngularDoctorConfig, Diagnostic, ProjectInfo } from '../types.js';
import type { NamingConventionSnapshot } from '../project/infer-naming-convention.js';
import { getStyleGuideUrl } from './style-guide-catalog.js';

export interface RuleContext {
  project: ProjectInfo;
  file: string;
  content: string;
  files?: string[];
  config?: AngularDoctorConfig;
  naming?: NamingConventionSnapshot;
}

export function lineFromIndex(content: string, index: number): { line: number; column: number } {
  const before = content.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

export function diag(partial: Omit<Diagnostic, 'id' | 'source'>, index = 0): Diagnostic {
  const docsUrl =
    partial.docsUrl ??
    getStyleGuideUrl(partial.ruleId) ??
    (partial.migrationId ? getMigrationById(partial.migrationId)?.docsUrl : undefined);
  return {
    ...partial,
    docsUrl,
    id: `${partial.ruleId}:${partial.file}:${partial.line}:${partial.column}:${index}`,
    source: 'angular-doctor',
  };
}

export function majorVersion(project: ProjectInfo): number {
  if (!project.angularVersion) {
    // Unknown version: stay conservative. Version-gated rules all guard with
    // `majorVersion(...) < N`, so 0 disables them instead of assuming latest.
    return 0;
  }
  return Number.parseInt(project.angularVersion.split('.')[0] ?? '0', 10);
}

export function isUnderSrc(file: string): boolean {
  return /\/src\//.test(file) || file.includes('/src/');
}

const DECLARATION_DECORATORS = [
  'Component',
  'Directive',
  'Pipe',
  'Injectable',
  'Service',
  'NgModule',
];
const TESTABLE_DECORATORS = ['Component', 'Directive', 'Pipe', 'Injectable', 'Service'];

/** True when the file declares any Angular-decorated class. */
export function hasAngularDeclaration(content: string): boolean {
  return new RegExp(`@(?:${DECLARATION_DECORATORS.join('|')})\\s*\\(`).test(content);
}

/** True when the file declares a testable Angular class (not NgModule). */
export function hasTestableDeclaration(content: string): boolean {
  return new RegExp(`@(?:${TESTABLE_DECORATORS.join('|')})\\s*\\(`).test(content);
}

/**
 * True when the class exported at `exportIndex` carries an Angular decorator.
 * Such classes are used through selectors, routes, or DI, so dead-code checks
 * must not report them just because nothing imports the class by name.
 */
export function isDecoratedExport(content: string, exportIndex: number): boolean {
  const before = content.slice(Math.max(0, exportIndex - 4000), exportIndex);
  const decoratorRe = new RegExp(`@(?:${DECLARATION_DECORATORS.join('|')})\\s*\\(`, 'g');
  const classRe = /\bclass\s+\w+/g;
  let lastDecorator = -1;
  let lastClass = -1;
  let match: RegExpExecArray | null;
  while ((match = decoratorRe.exec(before)) !== null) {
    lastDecorator = match.index;
  }
  while ((match = classRe.exec(before)) !== null) {
    lastClass = match.index;
  }
  return lastDecorator >= 0 && lastDecorator > lastClass;
}
