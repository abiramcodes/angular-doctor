import { describe, expect, it } from 'vitest';
import {
  ruleFilenameClassMismatch,
  ruleMissingSpecFile,
} from '../src/rules/naming/naming-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

describe('Analog page files', () => {
  it('skips spec and filename checks for routed .page.ts files', () => {
    const ctx = {
      project,
      file: '/tmp/src/app/pages/docs/rules.page.ts',
      content: `import type { RouteMeta } from '@analogjs/router';\n\nexport const routeMeta: RouteMeta = { title: 'Rules' };\n\n@Component({ template: '' })\nexport default class DocsRules {}`,
    };
    expect(ruleMissingSpecFile(ctx)).toEqual([]);
    expect(ruleFilenameClassMismatch(ctx)).toEqual([]);
  });

  it('still checks ordinary component files', () => {
    const ctx = {
      project,
      file: '/tmp/src/app/widget.ts',
      content: `@Component({ template: '' })\nexport class Widget {}`,
    };
    expect(ruleMissingSpecFile(ctx)).toHaveLength(1);
    expect(ruleFilenameClassMismatch(ctx)).toEqual([]);
  });
});
