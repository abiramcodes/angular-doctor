import type { AngularDoctorConfig, Diagnostic, Severity } from '../types.js';
import { getCatalogEntry } from './style-guide-catalog.js';

export function resolveRuleSeverity(
  ruleId: string,
  emitted: Severity,
  config?: AngularDoctorConfig,
): Severity | null {
  const override = config?.rules?.[ruleId];
  if (override === 'off') {
    return null;
  }
  if (override === 'error' || override === 'warn' || override === 'warning') {
    return override === 'warn' ? 'warning' : override;
  }
  const catalog = getCatalogEntry(ruleId);
  if (catalog && !override) {
    return catalog.defaultSeverity;
  }
  return emitted;
}

export function applyRuleConfig(
  diagnostics: Diagnostic[],
  config?: AngularDoctorConfig,
): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const d of diagnostics) {
    const severity = resolveRuleSeverity(d.ruleId, d.severity, config);
    if (severity === null) {
      continue;
    }
    out.push({ ...d, severity });
  }
  return out;
}
