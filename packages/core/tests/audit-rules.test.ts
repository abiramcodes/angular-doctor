import { describe, expect, it } from 'vitest';
import { ruleInnerHtml, ruleTargetBlank } from '../src/rules/audit/security-rules.js';
import type { RuleContext } from '../src/rules/diag-helpers.js';
import { explainRule, listRuleCards } from '../src/rules/registry.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function ctx(file: string, content: string, files?: string[]): RuleContext {
  return { project, file, content, files };
}

describe('security rules', () => {
  it('flags a direct innerHTML assignment and ignores a sanitized binding', () => {
    const found = ruleInnerHtml(
      ctx('/tmp/src/app/view.ts', '<div [innerHTML]="html"></div>\nel.innerHTML = value;\n'),
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.ruleId).toBe('angular-doctor/inner-html');
    expect(found[0]?.line).toBe(2);
  });

  it('flags target blank only when rel is missing', () => {
    const found = ruleTargetBlank(
      ctx(
        '/tmp/src/app/view.html',
        [
          '<a target="_blank" href="https://angular.dev">Docs</a>',
          '<a target="_blank" rel="noopener" href="https://angular.dev">Safe</a>',
          `<a [target]="'_blank'" rel="noreferrer">Also safe</a>`,
        ].join('\n'),
      ),
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.line).toBe(1);
  });
});

describe('inner-html', () => {
  it('ignores a sanitized [innerHTML] binding with no security bypass', () => {
    const content = '<article [innerHTML]="renderedMarkdown"></article>';
    expect(ruleInnerHtml(ctx('/tmp/src/app/post.html', content))).toHaveLength(0);
  });

  it('flags [innerHTML] when the file bypasses the sanitizer', () => {
    const content = [
      `const html = this.sanitizer.bypassSecurityTrustHtml(raw);`,
      `<article [innerHTML]="html"></article>`,
    ].join('\n');
    expect(ruleInnerHtml(ctx('/tmp/src/app/post.ts', content))).toHaveLength(1);
  });

  it('flags a direct innerHTML assignment', () => {
    expect(ruleInnerHtml(ctx('/tmp/src/app/view.ts', 'el.innerHTML = value;'))).toHaveLength(1);
  });

  it('flags an innerHTML += append', () => {
    expect(ruleInnerHtml(ctx('/tmp/src/app/view.ts', 'el.innerHTML += chunk;'))).toHaveLength(1);
  });

  it('ignores [innerHTML] when the bypass is only mentioned in a comment', () => {
    const content = [
      '// Never use bypassSecurityTrustHtml here.',
      '@Component({ template: \'<article [innerHTML]="html"></article>\' })',
      'export class Post {}',
    ].join('\n');
    expect(ruleInnerHtml(ctx('/tmp/src/app/post.ts', content))).toHaveLength(0);
  });
});

describe('target-blank', () => {
  it('ignores a bound rel attribute', () => {
    const html = `<a target="_blank" [rel]="relValue" href="https://angular.dev">Docs</a>`;
    expect(ruleTargetBlank(ctx('/tmp/src/app/view.html', html))).toHaveLength(0);
  });

  it('still flags target blank with no rel at all', () => {
    const html = '<a target="_blank" href="https://angular.dev">Docs</a>';
    expect(ruleTargetBlank(ctx('/tmp/src/app/view.html', html))[0]?.ruleId).toBe(
      'angular-doctor/target-blank',
    );
  });
});

describe('rule catalog', () => {
  it('explains a known rule and rejects an unknown id', () => {
    const rule = explainRule('angular-doctor/inner-html');
    expect(rule.category).toBe('security');
    expect(rule.summary).toContain('innerHTML');
    expect(() => explainRule('angular-doctor/not-a-rule')).toThrow(/Unknown rule/);
  });

  it('filters the catalog by category', () => {
    const security = listRuleCards('security').map((rule) => rule.id);
    expect(security).toContain('angular-doctor/inner-html');
    expect(security).toContain('angular-doctor/security-bypass');
    expect(security).not.toContain('angular-doctor/prefer-control-flow');
  });

  it('no longer lists the rules removed in 0.3.0', () => {
    const ids = listRuleCards().map((rule) => rule.id);
    for (const removed of [
      'angular-doctor/client-secret',
      'angular-doctor/env-file',
      'angular-doctor/img-alt',
      'angular-doctor/click-without-keyboard',
      'angular-doctor/positive-tabindex',
      'angular-doctor/control-missing-label',
      'angular-doctor/cleanup-unused-imports-hint',
      'angular-doctor/unused-export',
      'angular-doctor/complex-component',
      'angular-doctor/repeated-template',
      'angular-doctor/repeated-component-logic',
      'angular-doctor/template-complexity',
      'angular-doctor/template-arrow-not-called',
    ]) {
      expect(ids).not.toContain(removed);
    }
    expect(ids).toContain('angular-doctor/lifecycle-hook-complexity');
    expect(ids).toHaveLength(68);
  });
});
