import { describe, expect, it } from 'vitest';
import { calculateScore } from '../src/score/calculate-score.js';
import type { Diagnostic } from '../src/types.js';

function diag(severity: Diagnostic['severity'], ruleId = 'test/rule', file = 'a.ts'): Diagnostic {
  return {
    id: `${ruleId}:${file}`,
    ruleId,
    severity,
    category: 'hygiene',
    message: 'test',
    file,
    line: 1,
    column: 1,
    source: 'angular-doctor',
  };
}

describe('calculateScore', () => {
  it('returns 100 for no diagnostics', () => {
    expect(calculateScore([])).toBe(100);
  });

  it('charges each rule once', () => {
    expect(calculateScore([diag('error')])).toBe(98.5);
    expect(calculateScore([diag('warning')])).toBe(99.25);
    expect(calculateScore([diag('info')])).toBe(100);
    expect(calculateScore([diag('error'), diag('error', 'test/rule', 'b.ts'), diag('error')])).toBe(
      98.5,
    );
    expect(calculateScore([diag('error', 'test/one'), diag('error', 'test/two')])).toBe(97);
  });
});
