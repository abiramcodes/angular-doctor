import { describe, expect, it } from 'vitest';
import { oxlintRuleId } from '../src/runners/run-oxlint.js';

describe('oxlintRuleId', () => {
  it('reads the rule name from the code field', () => {
    expect(oxlintRuleId({ code: 'eslint(eqeqeq)' })).toBe('oxlint/eqeqeq');
    expect(oxlintRuleId({ code: 'typescript(no-unused-vars)' })).toBe('oxlint/no-unused-vars');
    expect(oxlintRuleId({})).toBe('oxlint/unknown');
  });
});
