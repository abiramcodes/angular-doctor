import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ruleGetterInTemplate } from '../src/rules/templates/getter-in-template.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function scan(content: string) {
  return ruleGetterInTemplate({ project, file: '/tmp/src/app/cart.ts', content });
}

describe('getter in template', () => {
  it('flags an interpolated getter as an error', () => {
    const found = scan(
      `@Component({ template: '<p>{{ total }}</p>' })
export class Cart {
  private items = [1, 2];
  get total(): number {
    return this.items.length;
  }
}`,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.ruleId).toBe('angular-doctor/getter-in-template');
    expect(found[0]?.severity).toBe('error');
    expect(found[0]?.message).toContain('"total"');
  });

  it('flags a getter read in control flow and bindings', () => {
    const found = scan(
      `@Component({ template: \`@if (isValid) { <button [disabled]="isValid">Save</button> }\` })
export class Form {
  get isValid(): boolean {
    return true;
  }
}`,
    );
    expect(found.length).toBeGreaterThanOrEqual(2);
  });

  it('allows signal reads, method calls, fields, and object properties', () => {
    expect(
      scan(
        `@Component({ template: '<p>{{ items() }} {{ label }} {{ format() }} {{ user.total }}</p>' })
export class Cart {
  protected readonly items = signal([1]);
  protected label = 'Cart';
  protected user = { total: 2 };
  format(): string {
    return 'x';
  }
  get total(): number {
    return 2;
  }
}`,
      ),
    ).toEqual([]);
  });

  it('ignores getters the template never reads', () => {
    expect(
      scan(
        `@Component({ template: '<p>Static</p>' })
export class Cart {
  get total(): number {
    return 2;
  }
}`,
      ),
    ).toEqual([]);
  });

  it('pairs an external template with its component class', () => {
    const root = join(tmpdir(), `ng-doctor-getter-html-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, 'cart.ts'),
      `@Component({ templateUrl: './cart.html' })
export class Cart {
  get total(): number {
    return 2;
  }
}
`,
    );
    const found = ruleGetterInTemplate({
      project,
      file: join(root, 'cart.html'),
      content: '<p>{{ total }}</p>',
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.severity).toBe('error');
  });
});
