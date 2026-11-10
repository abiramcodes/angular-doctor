import type { Diagnostic, ScanTotals } from '../types.js';

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

  for (const diagnostic of diagnostics) {
    totals[diagnostic.severity] += 1;
    totals.byCategory[diagnostic.category] += 1;
  }

  return totals;
}

const ERROR_WEIGHT = 1.5;
const WARNING_WEIGHT = 0.75;

export function calculateScore(diagnostics: Diagnostic[]): number {
  const errorFiles = new Set<string>();
  const warningRules = new Set<string>();

  for (const diagnostic of diagnostics) {
    if (diagnostic.severity === 'info') {
      continue;
    }
    if (diagnostic.severity === 'error') {
      errorFiles.add(`${diagnostic.ruleId}\0${diagnostic.file}`);
      continue;
    }
    warningRules.add(diagnostic.ruleId);
  }

  for (const key of errorFiles) {
    warningRules.delete(key.slice(0, key.indexOf('\0')));
  }

  const penalty = errorFiles.size * ERROR_WEIGHT + warningRules.size * WARNING_WEIGHT;
  return Math.max(0, 100 - Math.min(penalty, 100));
}
