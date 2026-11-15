import { describe, expect, it } from 'vitest';
import { groupDiagnostics } from '../src/report/group-diagnostics.js';
import { buildHtmlReport } from '../src/report/html-report.js';
import { buildMarkdownReport } from '../src/report/markdown-report.js';
import type { Diagnostic, ProjectInfo, ScanResult } from '../src/types.js';

const project: ProjectInfo = {
  root: '/work/app',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/work/app'],
};

function diag(file: string, line: number): Diagnostic {
  return {
    id: `x:${file}:${line}`,
    ruleId: 'angular-doctor/example',
    severity: 'warning',
    category: 'hygiene',
    message: 'Example problem <here>.',
    file,
    line,
    column: 1,
    docsUrl: 'https://example.com/ref',
    source: 'angular-doctor',
  };
}

const diagnostics = [
  diag('/work/app/src/b.ts', 3),
  diag('/work/app/src/a.ts', 9),
  diag('/work/app/src/a.ts', 2),
];

const result: Omit<ScanResult, 'reportPath'> = {
  score: 98.5,
  diagnostics,
  totals: {
    error: 0,
    warning: 3,
    info: 0,
    byCategory: {
      correctness: 0,
      performance: 0,
      maintainability: 0,
      security: 0,
      accessibility: 0,
      hygiene: 3,
    },
  },
  project,
  skippedChecks: [],
  durationMs: 12,
  filesScanned: 2,
  filesTotal: 2,
};

describe('diagnostic grouping', () => {
  it('clubs repeats of one rule and sorts locations', () => {
    const groups = groupDiagnostics(diagnostics);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.fileCount).toBe(2);
    expect(groups[0]?.items.map((d) => `${d.file}:${d.line}`)).toEqual([
      '/work/app/src/a.ts:2',
      '/work/app/src/a.ts:9',
      '/work/app/src/b.ts:3',
    ]);
  });

  it('groups the Markdown report with relative paths', () => {
    const md = buildMarkdownReport(result, project);
    expect(md).toContain('angular-doctor/example (warning) — 3 occurrences in 2 files');
    expect(md).toContain('`src/a.ts:2:1`');
    expect(md).not.toContain('/work/app/src/a.ts');
    expect(md).toContain('**Health score:** 99/100');
  });

  it('renders a self-contained HTML report with category tabs', () => {
    const html = buildHtmlReport(result, project);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="tab-hygiene"');
    expect(html).toContain('<span class="tab-count">(3)</span>');
    expect(html).toContain('class="skip"');
    expect(html).toContain('id="severity-filter"');
    expect(html).toContain('<option value="error">Errors only</option>');
    expect(html).toContain('<option value="warning">Warnings only</option>');
    expect(html).toContain('<option value="info">Info only</option>');
    expect(html).toContain('target="_blank" rel="noreferrer">Reference</a>');
    expect(html).toContain("querySelector('.tab-count')");
    expect(html).toContain('src/a.ts:2:1');
    expect(html).toContain('Example problem &lt;here&gt;.');
    expect(html).not.toContain('/work/app/src/a.ts');
  });
});
