import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runSharedComponentCheck } from '../src/rules/components/shared-component-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function check(files: string[]) {
  return runSharedComponentCheck({
    project,
    file: project.root,
    content: '',
    files,
  });
}

describe('shared component checks', () => {
  it('flags a template longer than 80 lines', () => {
    const root = join(tmpdir(), `ng-doctor-complex-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'big.ts');
    const lines = Array.from({ length: 90 }, () => '  <p>x</p>').join('\n');
    writeFileSync(file, `@Component({ template: \`\n${lines}\n\` })\nexport class Big {}\n`);
    const found = check([file]).filter(
      (item) => item.ruleId === 'angular-doctor/complex-component',
    );
    expect(found).toHaveLength(1);
    const templateLines = Number(found[0]?.message.match(/(\d+) template lines/)?.[1]);
    expect(templateLines).toBeGreaterThan(80);
    expect(found[0]?.severity).toBe('info');
  });

  it('flags a shared form block and ignores a one-line div', () => {
    const root = join(tmpdir(), `ng-doctor-template-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const form = `
      <form>
        <label></label>
        <input />
        <label></label>
        <input />
        <label></label>
        <input />
        <button></button>
      </form>`;
    const first = join(root, 'edit.ts');
    const second = join(root, 'create.ts');
    writeFileSync(
      first,
      `@Component({ template: \`${form}<p>Edit</p>\` })\nexport class Edit {}\n`,
    );
    writeFileSync(
      second,
      `@Component({ template: \`<section>Create</section>${form}\` })\nexport class Create {}\n`,
    );
    const shared = check([first, second]).filter(
      (item) => item.ruleId === 'angular-doctor/repeated-template',
    );
    expect(shared).toHaveLength(1);
    expect(shared[0]?.file).toBe(second);
    expect(shared[0]?.message).toContain(first);

    const loneA = join(root, 'a.ts');
    const loneB = join(root, 'b.ts');
    writeFileSync(loneA, "@Component({ template: '<div></div>' })\nexport class A {}\n");
    writeFileSync(loneB, "@Component({ template: '<div></div>' })\nexport class B {}\n");
    expect(
      check([loneA, loneB]).filter((item) => item.ruleId === 'angular-doctor/repeated-template'),
    ).toHaveLength(0);
  });

  it('flags methods that differ only by a string literal', () => {
    const root = join(tmpdir(), `ng-doctor-logic-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const body = (word: string) => `save(): void {
      const a = 1;
      const b = 2;
      const c = 3;
      const d = 4;
      const e = 5;
      const f = 6;
      const g = 7;
      const h = "${word}";
      const i = 8;
      const j = 9;
    }`;
    const first = join(root, 'one.ts');
    const second = join(root, 'two.ts');
    writeFileSync(first, `@Component({ template: '' })\nexport class One {\n${body('hello')}\n}\n`);
    writeFileSync(
      second,
      `@Component({ template: '' })\nexport class Two {\n${body('world')}\n}\n`,
    );
    const found = check([first, second]).filter(
      (item) => item.ruleId === 'angular-doctor/repeated-component-logic',
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.file).toBe(second);
    expect(found[0]?.message).toContain(first);
  });

  it('ignores app config and route files', () => {
    const root = join(tmpdir(), `ng-doctor-config-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const config = join(root, 'app.config.ts');
    const routes = join(root, 'app.routes.ts');
    writeFileSync(config, 'export const appConfig = {};\n');
    writeFileSync(routes, 'export const routes = [];\n');
    expect(check([config, routes])).toHaveLength(0);
  });
});
