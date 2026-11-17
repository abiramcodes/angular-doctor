import { describe, expect, it } from 'vitest';
import { ruleMissingForTrack } from '../src/rules/modernization/control-flow.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'test',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

describe('ruleMissingForTrack', () => {
  it('passes when track is present in a multiline @for', () => {
    const content = `@for (item of items; track item.id) { <span></span> }`;
    expect(ruleMissingForTrack({ project, file: 'x.html', content })).toHaveLength(0);
  });

  it('flags @for without track', () => {
    const content = `@for (item of items) { <span></span> }`;
    expect(ruleMissingForTrack({ project, file: 'x.html', content })[0]?.ruleId).toBe(
      'angular-doctor/missing-for-track',
    );
  });

  it('flags @for without track when the brace is on the next line', () => {
    const content = '@for (item of items)\n{ <span></span> }';
    expect(ruleMissingForTrack({ project, file: 'x.html', content })).toHaveLength(1);
  });

  it('passes when track calls a function with parentheses', () => {
    const content = '@for (item of items; track idOf(item)) { <span></span> }';
    expect(ruleMissingForTrack({ project, file: 'x.html', content })).toHaveLength(0);
  });
});
