import { describe, expect, it } from 'vitest';
import { resolveRuleSeverity } from '../src/rules/rule-config.js';

describe('resolveRuleSeverity', () => {
  it('honours every override including info and off', () => {
    const id = 'angular-doctor/example';
    expect(resolveRuleSeverity(id, 'error', { rules: { [id]: 'info' } })).toBe('info');
    expect(resolveRuleSeverity(id, 'error', { rules: { [id]: 'warn' } })).toBe('warning');
    expect(resolveRuleSeverity(id, 'info', { rules: { [id]: 'error' } })).toBe('error');
    expect(resolveRuleSeverity(id, 'warning', { rules: { [id]: 'off' } })).toBeNull();
  });

  it('promotes correctness warnings to errors by default', () => {
    expect(
      resolveRuleSeverity('angular-doctor/ng-model-name', 'warning', undefined, 'correctness'),
    ).toBe('error');
    expect(
      resolveRuleSeverity(
        'angular-doctor/pipe-name-hyphen',
        'warning',
        undefined,
        'maintainability',
      ),
    ).toBe('warning');
    expect(resolveRuleSeverity('angular-doctor/example', 'warning', undefined)).toBe('warning');
  });

  it('promotes style-guide infos but leaves preference infos alone', () => {
    expect(
      resolveRuleSeverity('angular-doctor/type-based-folder', 'info', undefined, 'hygiene'),
    ).toBe('warning');
    expect(
      resolveRuleSeverity('angular-doctor/prefer-http-resource', 'info', undefined, 'performance'),
    ).toBe('info');
  });

  it('lets an explicit override beat the strict promotion', () => {
    expect(
      resolveRuleSeverity(
        'angular-doctor/ng-model-name',
        'warning',
        { rules: { 'angular-doctor/ng-model-name': 'info' } },
        'correctness',
      ),
    ).toBe('info');
  });
});
