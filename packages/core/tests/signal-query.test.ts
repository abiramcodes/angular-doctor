import { describe, expect, it } from 'vitest';
import { ruleLegacyQuery } from '../src/rules/modernization/signals.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function scan(content: string, angularVersion = '22.0.0') {
  return ruleLegacyQuery({
    project: { ...project, angularVersion },
    file: '/tmp/src/app/panel.ts',
    content,
  });
}

describe('legacy decorator queries', () => {
  it('warns on each decorator query and names the signal replacement', () => {
    const found = scan(
      `export class Panel {
  @ViewChild('box') box?: unknown;
  @ViewChildren('row') rows?: unknown;
  @ContentChild('head') head?: unknown;
  @ContentChildren('cell') cells?: unknown;
}`,
    );
    expect(found.map((d) => d.message)).toEqual([
      'Decorator-based query @ViewChild found. Prefer the viewChild() signal query.',
      'Decorator-based query @ViewChildren found. Prefer the viewChildren() signal query.',
      'Decorator-based query @ContentChild found. Prefer the contentChild() signal query.',
      'Decorator-based query @ContentChildren found. Prefer the contentChildren() signal query.',
    ]);
    expect(found.every((d) => d.severity === 'warning')).toBe(true);
    expect(found.every((d) => d.ruleId === 'angular-doctor/prefer-signal-query')).toBe(true);
  });

  it('allows signal queries and stays off before Angular 19', () => {
    expect(scan("protected box = viewChild<ElementRef>('box');")).toEqual([]);
    expect(scan("@ViewChild('box') box?: unknown;", '18.2.0')).toEqual([]);
  });
});
