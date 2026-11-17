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

export const TEMPLATE_STYLE_RULES = [ruleGenericEventHandler] as const;
