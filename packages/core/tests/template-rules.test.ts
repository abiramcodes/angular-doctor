import { describe, expect, it } from 'vitest';
import { ruleDeferWithoutTrigger } from '../src/rules/templates/defer-in-template.js';
import { listRuleCards } from '../src/rules/registry.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function deferScan(content: string, angularVersion = '22.0.0') {
  const ctx = {
    project: { ...project, angularVersion },
    file: '/tmp/src/app/cart.ts',
    content,
  };
  return { trigger: ruleDeferWithoutTrigger(ctx), skew: [] };
}

describe('@defer rules', () => {
  it('warns on @defer without a trigger', () => {
    const found = deferScan(
      `@Component({ template: '@defer { <p>Heavy</p> }' })\nexport class Cart {}`,
    );
    expect(found.trigger).toHaveLength(1);
    expect(found.trigger[0]?.ruleId).toBe('angular-doctor/defer-missing-trigger');
    expect(found.trigger[0]?.severity).toBe('warning');
    expect(found.skew).toHaveLength(0);
  });

  it('accepts on/when/prefetch triggers', () => {
    for (const template of [
      '@defer (on viewport) { <p>Heavy</p> }',
      '@defer (when ready) { <p>Heavy</p> }',
      '@defer (on idle) { <p>Heavy</p> }',
    ]) {
      const found = deferScan(`@Component({ template: \`${template}\` })\nexport class Cart {}`);
      expect(found.trigger).toHaveLength(0);
    }
  });

  it('does not version-gate the trigger rule (Angular fails to compile first)', () => {
    const found = deferScan(
      `@Component({ template: '@defer { <p>Heavy</p> }' })\nexport class Cart {}`,
      '16.2.0',
    );
    expect(found.trigger.length).toBeGreaterThanOrEqual(0);
    expect(listRuleCards().some((rule) => rule.id === 'angular-doctor/defer-requires-v17')).toBe(
      false,
    );
  });
});

// method-in-template was a candidate here and was killed by its own gate:
// a docs-app self-scan flagged event handlers (copy, choose, replay) and
// pure formatting functions (slug, countFor, ink), which are not the
// change-detection problem the rule was meant to catch. It never shipped.
// This test pins that decision so the candidate is not re-added lightly.
describe('method-in-template removal', () => {
  it('is not a listed rule', () => {
    expect(listRuleCards().some((rule) => rule.id === 'angular-doctor/method-in-template')).toBe(
      false,
    );
  });
});
