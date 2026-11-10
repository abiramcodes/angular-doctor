import { describe, expect, it } from 'vitest';
import {
  getMigrationById,
  getMigrationForRule,
  getRecommendedMigrations,
  MIGRATION_ENTRIES,
  MIGRATIONS_HUB,
} from '../src/migrations/registry.js';
import { buildMarkdownReport } from '../src/report/markdown-report.js';
import type { Diagnostic, ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp/app',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp/app'],
};

function diagnostic(
  partial: Partial<Diagnostic> & Pick<Diagnostic, 'ruleId' | 'file'>,
): Diagnostic {
  return {
    id: 'x',
    severity: 'warning',
    category: 'correctness',
    message: 'test',
    line: 1,
    column: 1,
    source: 'angular-doctor',
    ...partial,
  };
}

describe('migration registry', () => {
  it('does not include a bundled signals migration', () => {
    const ids = MIGRATION_ENTRIES.map((e) => e.id);
    expect(ids).not.toContain('signals');
    expect(MIGRATION_ENTRIES.some((e) => e.schematic.includes(':signals'))).toBe(false);
  });

  it('maps prefer-inject to inject migration', () => {
    const entry = getMigrationForRule('angular-doctor/prefer-inject');
    expect(entry?.id).toBe('inject');
    expect(entry?.docsUrl).toBe(`${MIGRATIONS_HUB}/inject-function`);
  });

  it('deduplicates recommended commands', () => {
    const diags = [
      diagnostic({
        ruleId: 'angular-doctor/prefer-inject',
        migrationId: 'inject',
        file: '/tmp/app/src/a.ts',
      }),
      diagnostic({
        ruleId: 'angular-doctor/prefer-inject',
        migrationId: 'inject',
        file: '/tmp/app/src/b.ts',
      }),
    ];
    const rec = getRecommendedMigrations(diags, project.root, project.angularVersion);
    expect(rec).toHaveLength(1);
    expect(rec[0]?.command).toContain('--path src');
  });

  it('orders standalone before control-flow', () => {
    const diags = [
      diagnostic({
        ruleId: 'angular-doctor/prefer-control-flow',
        migrationId: 'control-flow',
        file: '/tmp/app/x.html',
      }),
      diagnostic({
        ruleId: 'angular-doctor/prefer-standalone',
        migrationId: 'standalone',
        file: '/tmp/app/m.ts',
      }),
    ];
    const rec = getRecommendedMigrations(diags, project.root, project.angularVersion);
    expect(rec[0]?.id).toBe('standalone');
    expect(rec[1]?.id).toBe('control-flow');
  });

  it('includes hub and commands in markdown report', () => {
    const report = buildMarkdownReport(
      {
        score: 90,
        diagnostics: [
          diagnostic({
            ruleId: 'angular-doctor/prefer-inject',
            migrationId: 'inject',
            file: '/tmp/app/src/c.ts',
          }),
        ],
        totals: {
          error: 0,
          warning: 1,
          info: 0,
          byCategory: {
            correctness: 0,
            performance: 0,
            maintainability: 1,
            security: 0,
            accessibility: 0,
            hygiene: 0,
          },
        },
        project,
        skippedChecks: [],
        durationMs: 10,
        filesScanned: 1,
        filesTotal: 1,
      },
      project,
    );
    expect(report).toContain(MIGRATIONS_HUB);
    expect(report).toContain('## Recommended migration commands');
    expect(report).toContain('ng generate @angular/core:inject');
    expect(getMigrationById('control-flow')?.schematic).toContain('control-flow');
  });
});
