import { describe, expect, it } from 'vitest';
import {
  ruleExplicitEagerChangeDetection,
  ruleNgSrcDimensions,
  ruleNgSrcFillDimensions,
  ruleNgSrcPlaceholderSize,
  rulePreferNgOptimizedImage,
} from '../src/rules/templates/performance-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function ctx(file: string, content: string) {
  return { project, file, content };
}

describe('performance rules', () => {
  it('flags plain img src as info', () => {
    const found = rulePreferNgOptimizedImage(
      ctx('/tmp/src/app/hero.html', '<img src="logo.png" alt="Logo" />'),
    );
    expect(found[0]?.ruleId).toBe('angular-doctor/prefer-ng-optimized-image');
    expect(found[0]?.severity).toBe('info');
    expect(found[0]?.docsUrl).toContain('image-optimization');
  });

  it('flags property-bound src', () => {
    const found = rulePreferNgOptimizedImage(
      ctx('/tmp/src/app/hero.ts', '<img [src]="logo" alt="" />'),
    );
    expect(found).toHaveLength(1);
  });

  it('does not flag ngSrc or an img without a source', () => {
    expect(
      rulePreferNgOptimizedImage(
        ctx('/tmp/x.html', '<img ngSrc="cat.jpg" width="10" height="10" />'),
      ),
    ).toHaveLength(0);
    expect(rulePreferNgOptimizedImage(ctx('/tmp/x.html', '<img alt="" />'))).toHaveLength(0);
  });

  it('warns when ngSrc is missing dimensions', () => {
    const found = ruleNgSrcDimensions(ctx('/tmp/x.html', '<img ngSrc="hero.jpg" alt="" />'));
    expect(found[0]?.ruleId).toBe('angular-doctor/ng-src-dimensions');
    expect(found[0]?.severity).toBe('warning');
  });

  it('accepts width and height or fill alone', () => {
    expect(
      ruleNgSrcDimensions(ctx('/tmp/x.html', '<img ngSrc="a.jpg" width="400" height="200" />')),
    ).toHaveLength(0);
    expect(
      ruleNgSrcDimensions(ctx('/tmp/x.html', '<img [ngSrc]="src" [width]="w" [height]="h" />')),
    ).toHaveLength(0);
    expect(ruleNgSrcDimensions(ctx('/tmp/x.html', '<img ngSrc="a.jpg" fill />'))).toHaveLength(0);
    expect(ruleNgSrcFillDimensions(ctx('/tmp/x.html', '<img ngSrc="a.jpg" fill />'))).toHaveLength(
      0,
    );
  });

  it('warns when fill is combined with dimensions', () => {
    const found = ruleNgSrcFillDimensions(
      ctx('/tmp/x.html', '<img ngSrc="a.jpg" fill width="100" height="50" />'),
    );
    expect(found[0]?.ruleId).toBe('angular-doctor/ng-src-fill-dimensions');
    expect(found[0]?.severity).toBe('warning');
  });

  it('flags data URL placeholders larger than 4KB', () => {
    const payload = Buffer.alloc(4097, 1).toString('base64');
    const found = ruleNgSrcPlaceholderSize(
      ctx(
        '/tmp/x.html',
        `<img ngSrc="a.jpg" width="10" height="10" placeholder="data:image/png;base64,${payload}" />`,
      ),
    );
    expect(found[0]?.ruleId).toBe('angular-doctor/ng-src-placeholder-size');
    expect(found[0]?.severity).toBe('info');
  });

  it('ignores small data URL placeholders', () => {
    const payload = Buffer.alloc(32, 1).toString('base64');
    expect(
      ruleNgSrcPlaceholderSize(
        ctx(
          '/tmp/x.html',
          `<img ngSrc="a.jpg" width="10" height="10" placeholder="data:image/png;base64,${payload}" />`,
        ),
      ),
    ).toHaveLength(0);
  });

  it('flags explicit Default and Eager change detection', () => {
    const found = ruleExplicitEagerChangeDetection(
      ctx(
        '/tmp/x.ts',
        `@Component({ changeDetection: ChangeDetectionStrategy.Default }) export class A {}`,
      ),
    );
    expect(found[0]?.ruleId).toBe('angular-doctor/explicit-eager-change-detection');
    expect(found[0]?.severity).toBe('info');
    expect(
      ruleExplicitEagerChangeDetection(
        ctx(
          '/tmp/x.ts',
          `@Component({ changeDetection: ChangeDetectionStrategy.Eager }) export class A {}`,
        ),
      ),
    ).toHaveLength(1);
  });

  it('does not flag omitted change detection or OnPush', () => {
    expect(
      ruleExplicitEagerChangeDetection(
        ctx('/tmp/x.ts', '@Component({ selector: "a" }) export class A {}'),
      ),
    ).toHaveLength(0);
    expect(
      ruleExplicitEagerChangeDetection(
        ctx(
          '/tmp/x.ts',
          '@Component({ changeDetection: ChangeDetectionStrategy.OnPush }) export class A {}',
        ),
      ),
    ).toHaveLength(0);
  });
});
