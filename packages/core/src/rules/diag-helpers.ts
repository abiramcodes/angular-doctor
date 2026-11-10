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
    return 99;
  }
  return Number.parseInt(project.angularVersion.split('.')[0] ?? '0', 10);
}

export function isUnderSrc(file: string): boolean {
  return /\/src\//.test(file) || file.includes('/src/');
}
