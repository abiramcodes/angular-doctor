import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ruleNgDeep, runStrictCheck, runZoneJsCheck } from '../src/rules/audit/framework-rules.js';
import type { ProjectInfo } from '../src/types.js';

function project(root: string, version: string | null = '22.0.0'): ProjectInfo {
  return {
    root,
    name: 'app',
    kind: 'angular-cli',
    angularVersion: version,
    workspaceRoots: [root],
  };
}

describe('framework gaps React-style scanners miss', () => {
  it('flags ::ng-deep and ignores a TypeScript shift', () => {
    const css = ruleNgDeep({
      project: project('/tmp'),
      file: '/tmp/src/app/hero.scss',
      content: '.hero >>> .title { color: red; }\n',
    });
    expect(css.map((item) => item.ruleId)).toEqual(['angular-doctor/ng-deep']);
    const shifted = ruleNgDeep({
      project: project('/tmp'),
      file: '/tmp/src/app/hero.ts',
      content: 'const n = value >>> 1;\n',
    });
    expect(shifted).toHaveLength(0);
  });

  it('flags zone.js on Angular 20+ and ignores Angular 17', () => {
    const root = join(tmpdir(), `ng-doctor-zone-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const pkg = join(root, 'package.json');
    writeFileSync(pkg, JSON.stringify({ dependencies: { 'zone.js': '0.15.0' } }));
    const modern = runZoneJsCheck({
      project: project(root),
      file: root,
      content: '',
      files: [],
    });
    expect(modern[0]?.ruleId).toBe('angular-doctor/zone-js');
    expect(modern[0]?.severity).toBe('warning');
    const legacy = runZoneJsCheck({
      project: project(root, '17.3.0'),
      file: root,
      content: '',
      files: [],
    });
    expect(legacy).toHaveLength(0);
  });

  it('flags a tsconfig that extends a base without strict or strictTemplates', () => {
    const root = join(tmpdir(), `ng-doctor-strict-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, 'tsconfig.json'),
      '/* comment */\n{ "compilerOptions": { "target": "ES2022" } }\n',
    );
    writeFileSync(
      join(root, 'tsconfig.app.json'),
      '{ "extends": "./tsconfig.json", "compilerOptions": { "types": [] } }\n',
    );
    const found = runStrictCheck({
      project: project(root),
      file: root,
      content: '',
    });
    expect(found.map((item) => item.ruleId).sort()).toEqual([
      'angular-doctor/strict-templates',
      'angular-doctor/typescript-strict',
    ]);
  });

  it('accepts strict and strictTemplates inherited from the base config', () => {
    const root = join(tmpdir(), `ng-doctor-strict-ok-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { strict: true },
        angularCompilerOptions: { strictTemplates: true },
      }),
    );
    writeFileSync(join(root, 'tsconfig.app.json'), '{ "extends": "./tsconfig.json" }\n');
    expect(
      runStrictCheck({
        project: project(root),
        file: root,
        content: '',
      }),
    ).toHaveLength(0);
  });
});
