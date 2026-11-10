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
    expect(ruleMissingForTrack({ project, file: 'x.html', content })).toHaveLength(1);
  });
});
