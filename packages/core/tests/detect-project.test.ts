import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectProject } from '../src/project/detect-project.js';
import { rulePreferDocumentToken } from '../src/rules/preferences/runtime.js';
import { ruleProjectLayout } from '../src/rules/structure/project-structure-rules.js';

let seq = 0;

function workspace(angularJson: object, files: Record<string, string> = {}): string {
  seq += 1;
  const root = join(tmpdir(), `ng-doctor-detect-${Date.now()}-${seq}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'angular.json'), JSON.stringify(angularJson));
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ dependencies: { '@angular/core': '^22.0.0' } }),
  );
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const TWO_APPS = {
  projects: {
    shop: { root: 'apps/shop', sourceRoot: 'apps/shop/src', projectType: 'application' },
    admin: { root: 'apps/admin', sourceRoot: 'apps/admin/src', projectType: 'application' },
  },
};

describe('detectProject project model', () => {
  it('parses every angular.json project with absolute source roots', () => {
    const root = workspace(TWO_APPS, { 'apps/shop/src/main.ts': '' });
    const project = detectProject(root);
    expect(project?.projects?.map((p) => p.name).sort()).toEqual(['admin', 'shop']);
    expect(project?.projects?.find((p) => p.name === 'shop')?.sourceRoot).toBe(
      join(root, 'apps/shop/src'),
    );
  });

  it('checks layout per project instead of demanding a root src/main.ts', () => {
    const root = workspace(TWO_APPS, { 'apps/shop/src/main.ts': '' });
    const project = detectProject(root)!;
    const findings = ruleProjectLayout({ project, file: root, content: '' });
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('admin');
  });

  it('focuses the scan when invoked inside one project', () => {
    const root = workspace(TWO_APPS);
    const project = detectProject(join(root, 'apps/shop/src'));
    expect(project?.name).toBe('shop');
    expect(project?.focusRoot).toBe(join(root, 'apps/shop'));
  });

  it('detects SSR configuration for conditional severities', () => {
    const root = workspace({
      projects: {
        app: {
          root: '',
          sourceRoot: 'src',
          projectType: 'application',
          architect: { build: { options: { ssr: { entry: 'src/server.ts' } } } },
        },
      },
    });
    const project = detectProject(root)!;
    expect(project.hasSsr).toBe(true);

    const service = 'export class Svc {\n  go(): void {\n    document.title = "x";\n  }\n}\n';
    const found = rulePreferDocumentToken({
      project,
      file: join(root, 'src/svc.ts'),
      content: service,
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.severity).toBe('warning');

    const plain = { ...project, hasSsr: false };
    expect(
      rulePreferDocumentToken({ project: plain, file: join(root, 'src/svc.ts'), content: service }),
    ).toEqual([]);
  });
});
