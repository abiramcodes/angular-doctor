import type { AngularDoctorConfig, Category, Diagnostic, Severity } from '../types.js';
import { isStyleGuideOnlyRule } from './style-guide-catalog.js';

const STRICT_ERROR_CATEGORIES: ReadonlySet<Category> = new Set([
  'correctness',
  'security',
  'accessibility',
]);

// The strict promotion is the only mode: correctness, security, and
// accessibility warnings are errors, and style-guide infos are warnings.
// A per-rule override in config still wins because it returns earlier.
function promoteSeverity(
  ruleId: string,
  severity: Severity,
  category: Category | undefined,
): Severity {
  if (severity === 'warning' && category !== undefined && STRICT_ERROR_CATEGORIES.has(category)) {
    return 'error';
  }
  if (severity === 'info' && isStyleGuideOnlyRule(ruleId)) {
    return 'warning';
  }
  return severity;
}

export function resolveRuleSeverity(
  ruleId: string,
  emitted: Severity,
  config?: AngularDoctorConfig,
  category?: Category,
): Severity | null {
  const override = config?.rules?.[ruleId];
  if (override === 'off') {
    return null;
  }
  if (override === 'error' || override === 'info') {
    return override;
  }
  if (override === 'warn' || override === 'warning') {
    return 'warning';
  }
  // The registry card (via the severity rules emit) is the single severity
  // source. The style-guide catalog only carries documentation URLs.
  return promoteSeverity(ruleId, emitted, category);
}

export function applyRuleConfig(
  diagnostics: Diagnostic[],
  config?: AngularDoctorConfig,
): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const d of diagnostics) {
    const severity = resolveRuleSeverity(d.ruleId, d.severity, config, d.category);
    if (severity === null) {
      continue;
    }
    out.push({ ...d, severity });
  }
  return out;
}
