import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ruleTemplateForAllocation } from '../src/rules/templates/for-allocation.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function scan(content: string) {
  return ruleTemplateForAllocation({ project, file: '/tmp/src/app/list.ts', content });
}

describe('template @for allocation', () => {
  it('flags an @for over a method that filters into a new array', () => {
    const found = scan(
      `@Component({ template: \`@for (item of visible(); track item) {}\` })
export class List {
  private items = [1, 2, 3];
  visible(): number[] {
    return this.items.filter((n) => n > 1);
  }
}`,
    );
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/template-for-allocation']);
    expect(found[0]?.message).toContain('visible()');
  });

  it('allows signal and computed reads', () => {
    expect(
      scan(
        `@Component({ template: \`@for (item of items(); track item) {}\` })
export class List {
  protected readonly items = signal([1, 2]);
}`,
      ),
    ).toEqual([]);
    expect(
      scan(
        `@Component({ template: \`@for (item of visible(); track item) {}\` })
export class List {
  protected readonly visible = computed(() => [1, 2].filter((n) => n > 1));
}`,
      ),
    ).toEqual([]);
  });

  it('allows methods that return a stable reference', () => {
    expect(
      scan(
        `@Component({ template: \`@for (item of all(); track item) {}\` })
export class List {
  private items = [1, 2, 3];
  all(): number[] {
    return this.items;
  }
}`,
      ),
    ).toEqual([]);
  });

  it('pairs an external template with its component class', () => {
    const root = join(tmpdir(), `ng-doctor-for-html-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, 'list.ts'),
      `@Component({ templateUrl: './list.html' })
export class List {
  rows(): string[] {
    return ['a'].map((s) => s.toUpperCase());
  }
}
`,
    );
    const found = ruleTemplateForAllocation({
      project,
      file: join(root, 'list.html'),
      content: '@for (row of rows(); track row) {}',
    });
    expect(found).toHaveLength(1);
  });
});
