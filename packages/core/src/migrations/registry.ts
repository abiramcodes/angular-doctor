import type { Diagnostic } from '../types.js';
import { isAngularMajorAtLeast } from '../project/detect-project.js';

export const MIGRATIONS_HUB = 'https://angular.dev/reference/migrations';

export interface MigrationEntry {
  id: string;
  title: string;
  docsUrl: string;
  schematic: string;
  minAngularMajor: number;
  ruleIds: string[];
  reportOrder: number;
}

export const MIGRATION_ENTRIES: MigrationEntry[] = [
  {
    id: 'standalone',
    title: 'Standalone',
    docsUrl: `${MIGRATIONS_HUB}/standalone`,
    schematic: 'ng generate @angular/core:standalone',
    minAngularMajor: 15,
    ruleIds: ['angular-doctor/prefer-standalone', 'angular-doctor/standalone-false'],
    reportOrder: 10,
  },
  {
    id: 'common-to-standalone',
    title: 'CommonModule to standalone imports',
    docsUrl: `${MIGRATIONS_HUB}/common-to-standalone`,
    schematic: 'ng generate @angular/core:common-to-standalone',
    minAngularMajor: 15,
    ruleIds: ['angular-doctor/prefer-common-imports'],
    reportOrder: 20,
  },
  {
    id: 'control-flow',
    title: 'Control flow syntax',
    docsUrl: `${MIGRATIONS_HUB}/control-flow`,
    schematic: 'ng generate @angular/core:control-flow',
    minAngularMajor: 17,
    ruleIds: ['angular-doctor/prefer-control-flow'],
    reportOrder: 30,
  },
  {
    id: 'inject',
    title: 'inject() function',
    docsUrl: `${MIGRATIONS_HUB}/inject-function`,
    schematic: 'ng generate @angular/core:inject',
    minAngularMajor: 14,
    ruleIds: ['angular-doctor/prefer-inject'],
    reportOrder: 40,
  },
  {
    id: 'signal-input',
    title: 'Signal inputs',
    docsUrl: `${MIGRATIONS_HUB}/signal-inputs`,
    schematic: 'ng generate @angular/core:signal-input-migration',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-signal-input'],
    reportOrder: 50,
  },
  {
    id: 'output',
    title: 'Signal outputs',
    docsUrl: `${MIGRATIONS_HUB}/outputs`,
    schematic: 'ng generate @angular/core:output-migration',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-output-fn'],
    reportOrder: 60,
  },
  {
    id: 'signal-queries',
    title: 'Signal queries',
    docsUrl: `${MIGRATIONS_HUB}/signal-queries`,
    schematic: 'ng generate @angular/core:signal-queries-migration',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-signal-query'],
    reportOrder: 70,
  },
  {
    id: 'ngclass-to-class',
    title: 'ngClass to class bindings',
    docsUrl: `${MIGRATIONS_HUB}/ngclass-to-class`,
    schematic: 'ng generate @angular/core:ngclass-to-class',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-class-binding'],
    reportOrder: 80,
  },
  {
    id: 'ngstyle-to-style',
    title: 'ngStyle to style bindings',
    docsUrl: `${MIGRATIONS_HUB}/ngstyle-to-style`,
    schematic: 'ng generate @angular/core:ngstyle-to-style',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-style-binding'],
    reportOrder: 90,
  },
  {
    id: 'route-lazy-loading',
    title: 'Lazy-loaded routes',
    docsUrl: `${MIGRATIONS_HUB}/route-lazy-loading`,
    schematic: 'ng generate @angular/core:route-lazy-loading-migration',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-lazy-routes'],
    reportOrder: 100,
  },
  {
    id: 'self-closing-tag',
    title: 'Self-closing tags',
    docsUrl: `${MIGRATIONS_HUB}/self-closing-tags`,
    schematic: 'ng generate @angular/core:self-closing-tag',
    minAngularMajor: 19,
    ruleIds: [],
    reportOrder: 110,
  },
  {
    id: 'cleanup-unused-imports',
    title: 'Cleanup unused imports',
    docsUrl: `${MIGRATIONS_HUB}/cleanup-unused-imports`,
    schematic: 'ng generate @angular/core:cleanup-unused-imports',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/cleanup-unused-imports-hint'],
    reportOrder: 120,
  },
  {
    id: 'router-testing-module',
    title: 'RouterTestingModule migration',
    docsUrl: `${MIGRATIONS_HUB}/router-testing-module`,
    schematic: 'ng generate @angular/core:router-testing-module-migration',
    minAngularMajor: 19,
    ruleIds: ['angular-doctor/prefer-router-module-testing'],
    reportOrder: 130,
  },
  {
    id: 'service',
    title: '@Injectable to @Service',
    docsUrl: `${MIGRATIONS_HUB}/service`,
    schematic: 'ng generate @angular/core:service',
    minAngularMajor: 22,
    ruleIds: ['angular-doctor/prefer-service-decorator'],
    reportOrder: 140,
  },
];

const byId = new Map(MIGRATION_ENTRIES.map((e) => [e.id, e]));
const byRuleId = new Map<string, MigrationEntry>();
for (const entry of MIGRATION_ENTRIES) {
  for (const ruleId of entry.ruleIds) {
    byRuleId.set(ruleId, entry);
  }
}

export function getMigrationById(id: string): MigrationEntry | undefined {
  return byId.get(id);
}

export function getMigrationForRule(ruleId: string): MigrationEntry | undefined {
  return byRuleId.get(ruleId);
}

export function migrationAvailable(entry: MigrationEntry, angularVersion: string | null): boolean {
  if (!angularVersion) {
    return true;
  }
  return isAngularMajorAtLeast(angularVersion, entry.minAngularMajor);
}

export function buildSchematicWithPath(schematic: string, relativePath?: string): string {
  if (!relativePath || relativePath === '.' || relativePath === '') {
    return schematic;
  }
  return `${schematic} --path ${relativePath}`;
}

export function relativeDirFromProject(filePath: string, projectRoot: string): string {
  const normRoot = projectRoot.replace(/\/$/, '');
  if (!filePath.startsWith(normRoot)) {
    return '.';
  }
  const rel = filePath.slice(normRoot.length).replace(/^\//, '');
  const parts = rel.split('/');
  parts.pop();
  const dir = parts.join('/') || '.';
  return dir;
}

export interface RecommendedMigration {
  id: string;
  title: string;
  docsUrl: string;
  command: string;
}

export function getRecommendedMigrations(
  diagnostics: Diagnostic[],
  projectRoot: string,
  angularVersion: string | null,
): RecommendedMigration[] {
  const seen = new Set<string>();
  const items: { order: number; migration: RecommendedMigration }[] = [];

  for (const d of diagnostics) {
    const entry =
      (d.migrationId ? getMigrationById(d.migrationId) : undefined) ??
      getMigrationForRule(d.ruleId);
    if (!entry || seen.has(entry.id) || !migrationAvailable(entry, angularVersion)) {
      continue;
    }
    seen.add(entry.id);
    const relPath = relativeDirFromProject(d.file, projectRoot);
    items.push({
      order: entry.reportOrder,
      migration: {
        id: entry.id,
        title: entry.title,
        docsUrl: entry.docsUrl,
        command: buildSchematicWithPath(entry.schematic, relPath),
      },
    });
  }

  items.sort((a, b) => a.order - b.order);
  return items.map((i) => i.migration);
}
