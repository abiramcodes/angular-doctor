import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';

export function ruleNgClass(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.html') && !/\[ngClass\]|NgClass/.test(ctx.content)) {
    return [];
  }
  const re = /\[ngClass\]/g;
  let match: RegExpExecArray | null;
  const findings: Diagnostic[] = [];
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-class-binding',
          migrationId: 'ngclass-to-class',
          severity: 'info',
          category: 'maintainability',
          message: 'ngClass binding found. Prefer native class bindings.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Run ngclass-to-class migration where templates are eligible.',
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleNgStyle(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.html') && !/\[ngStyle\]|NgStyle/.test(ctx.content)) {
    return [];
  }
  const re = /\[ngStyle\]/g;
  let match: RegExpExecArray | null;
  const findings: Diagnostic[] = [];
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-style-binding',
          migrationId: 'ngstyle-to-style',
          severity: 'info',
          category: 'maintainability',
          message: 'ngStyle binding found. Prefer native style bindings.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Run ngstyle-to-style migration where templates are eligible.',
        },
        i++,
      ),
    );
  }
  return findings;
}
