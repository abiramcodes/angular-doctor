import { isStyleGuideOnlyRule } from '../rules/style-guide-catalog.js';
import type { Diagnostic, ScanTotals } from '../types.js';

const WEIGHT: Record<Diagnostic['severity'], number> = {
  error: 1.5,
  warning: 0.75,
  info: 0,
};

const SEVERITY_RANK: Record<Diagnostic['severity'], number> = {
  info: 1,
  warning: 2,
  error: 3,
};

export function summarizeDiagnostics(diagnostics: Diagnostic[]): ScanTotals {
  const totals: ScanTotals = {
    error: 0,
    warning: 0,
    info: 0,
    byCategory: {
      correctness: 0,
      performance: 0,
      maintainability: 0,
      security: 0,
      accessibility: 0,
      hygiene: 0,
    },
  };

  for (const d of diagnostics) {
    totals[d.severity] += 1;
    totals.byCategory[d.category] += 1;
  }

  return totals;
}

export function calculateScore(diagnostics: Diagnostic[]): number {
  const worst = new Map<string, Diagnostic['severity']>();
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === 'info' && isStyleGuideOnlyRule(diagnostic.ruleId)) {
      continue;
    }
    const current = worst.get(diagnostic.ruleId);
    if (!current || SEVERITY_RANK[diagnostic.severity] > SEVERITY_RANK[current]) {
      worst.set(diagnostic.ruleId, diagnostic.severity);
    }
  }
  let penalty = 0;
  for (const severity of worst.values()) {
    penalty += WEIGHT[severity];
  }
  return Math.max(0, 100 - Math.min(penalty, 100));
}
