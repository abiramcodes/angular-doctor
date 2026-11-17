import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ruleOneConceptPerFile,
  ruleProjectLayout,
  ruleTypeBasedFolder,
} from '../src/rules/structure/project-structure-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

describe('type-based-folder', () => {
  it('flags a type folder at the app root and ignores feature-local folders', () => {
    const shallow = ruleTypeBasedFolder({
      project,
      file: '/tmp/src/app/components/widget.ts',
      content: '',
    });
    expect(shallow[0]?.ruleId).toBe('angular-doctor/type-based-folder');
    const deep = ruleTypeBasedFolder({
      project,
      file: '/tmp/src/app/features/billing/components/widget.ts',
      content: '',
    });
    expect(deep).toHaveLength(0);
  });
});

describe('one-concept-per-file', () => {
  it('flags multiple components in a large file and ignores a small shared file', () => {
    const big = [
      '@Component({}) class A {}',
      '@Component({}) class B {}',
      ...Array.from({ length: 45 }, () => '// filler'),
    ].join('\n');
    const found = ruleOneConceptPerFile({ project, file: '/tmp/src/app/both.ts', content: big });
    expect(found[0]?.ruleId).toBe('angular-doctor/one-concept-per-file');
    const small = '@Component({}) class A {}\n@Component({}) class B {}\n';
    expect(
      ruleOneConceptPerFile({ project, file: '/tmp/src/app/small.ts', content: small }),
    ).toHaveLength(0);
  });
});

describe('project-layout', () => {
  it('flags a missing bootstrap entry and passes when main.ts exists', () => {
    const root = join(tmpdir(), `ng-doctor-layout-${Date.now()}`);
    mkdirSync(join(root, 'src'), { recursive: true });
    const info: ProjectInfo = { ...project, root, workspaceRoots: [root] };
    const missing = ruleProjectLayout({ project: info, file: root, content: '' });
    expect(missing[0]?.ruleId).toBe('angular-doctor/project-layout');
    writeFileSync(join(root, 'src', 'main.ts'), 'bootstrapApplication;\n');
    expect(ruleProjectLayout({ project: info, file: root, content: '' })).toHaveLength(0);
  });
});
