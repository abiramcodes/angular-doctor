import { describe, expect, it } from 'vitest';
import { rulePreferHostBindings } from '../src/rules/components/host-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

const file = '/tmp/src/app/slider.ts';

function scan(content: string) {
  return rulePreferHostBindings({ project, file, content });
}

describe('prefer host bindings', () => {
  it('flags @HostBinding and @HostListener', () => {
    const found = scan(`
      @Component({})
      export class CustomSlider {
        @HostBinding('attr.aria-valuenow') value = 0;
        @HostListener('keydown', ['$event'])
        updateValue(event: KeyboardEvent): void {}
      }
    `);
    expect(found.map((d) => d.message)).toEqual([
      '@HostBinding is backwards-compatible. Use the host option instead.',
      '@HostListener is backwards-compatible. Use the host option instead.',
    ]);
    expect(found.every((d) => d.severity === 'error')).toBe(true);
    expect(
      found.every((d) => d.docsUrl === 'https://angular.dev/guide/components/host-elements'),
    ).toBe(true);
    expect(found.every((d) => d.ruleId === 'angular-doctor/prefer-host-bindings')).toBe(true);
  });

  it('does not flag the host option', () => {
    const found = scan(`
      @Component({
        host: { '(keydown)': 'updateValue($event)' },
      })
      export class CustomSlider {
        updateValue(event: KeyboardEvent): void {}
      }
    `);
    expect(found).toHaveLength(0);
  });
});
