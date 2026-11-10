import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import type { Diagnostic } from '../../types.js';

export function ruleGenericEventHandler(ctx: RuleContext): Diagnostic[] {
  const isTemplate = ctx.file.endsWith('.html') || ctx.content.includes('template:');
  if (!isTemplate) {
    return [];
  }
  const re = /\((\w+)\)\s*=\s*"(handle\w+)(?:\([^"]*\))?"/g;
  const findings = [];
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/generic-event-handler',
          severity: 'info',
          category: 'maintainability',
          message: `Event handler "${match[2]}" should describe the action, not the event.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Rename to something like saveUserData() instead of handleClick().',
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleTemplateComplexity(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.html') && !ctx.content.includes('template:')) {
    return [];
  }
  const lines = ctx.content.split('\n');
  const findings = [];
  let i = 0;
  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo]!;
    const complexity =
      (line.match(/\?\s*[^:]+:/g) ?? []).length +
      (line.match(/&&|\|\|/g) ?? []).length +
      (line.match(/\.\w+\(/g) ?? []).length;
    if (complexity < 4) {
      continue;
    }
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/template-complexity',
          severity: 'info',
          category: 'maintainability',
          message: 'Template expression may be too complex for inline logic.',
          file: ctx.file,
          line: lineNo + 1,
          column: 1,
          suggestion: 'Move logic into the class with computed() or a small method.',
        },
        i++,
      ),
    );
  }
  return findings;
}

export const TEMPLATE_STYLE_RULES = [ruleGenericEventHandler, ruleTemplateComplexity] as const;
