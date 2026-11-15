import { relative } from 'node:path';
import type { Category, Diagnostic, Severity } from '../types.js';

export interface DiagnosticGroup {
  ruleId: string;
  severity: Severity;
  category: Category;
  /** The shared message when every instance agrees, else the first message. */
  message: string;
  messagesVary: boolean;
  suggestion?: string;
  docsUrl?: string;
  migrationId?: string;
  items: Diagnostic[];
  fileCount: number;
}

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export function groupDiagnostics(diagnostics: Diagnostic[]): DiagnosticGroup[] {
  const byKey = new Map<string, DiagnosticGroup>();
  for (const d of diagnostics) {
    const key = `${d.ruleId}\0${d.severity}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        ruleId: d.ruleId,
        severity: d.severity,
        category: d.category,
        message: d.message,
        messagesVary: false,
        suggestion: d.suggestion,
        docsUrl: d.docsUrl,
        migrationId: d.migrationId,
        items: [d],
        fileCount: 1,
      });
      continue;
    }
    existing.items.push(d);
    if (d.message !== existing.message) {
      existing.messagesVary = true;
    }
    if (!existing.suggestion && d.suggestion) {
      existing.suggestion = d.suggestion;
    }
  }
  const groups = [...byKey.values()];
  for (const group of groups) {
    group.fileCount = new Set(group.items.map((item) => item.file)).size;
    group.items.sort(
      (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
    );
  }
  groups.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      b.items.length - a.items.length ||
      a.ruleId.localeCompare(b.ruleId),
  );
  return groups;
}

export function groupByCategory(diagnostics: Diagnostic[]): Map<Category, DiagnosticGroup[]> {
  const map = new Map<Category, DiagnosticGroup[]>();
  for (const group of groupDiagnostics(diagnostics)) {
    const list = map.get(group.category) ?? [];
    list.push(group);
    map.set(group.category, list);
  }
  return map;
}

export function relativeFile(file: string, projectRoot: string): string {
  const rel = relative(projectRoot, file);
  return rel.startsWith('..') ? file : rel;
}
