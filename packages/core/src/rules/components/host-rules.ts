import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';

const DOCS_URL = 'https://angular.dev/guide/components/host-elements';

export function rulePreferHostBindings(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /@(HostBinding|HostListener)\b/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const name = match[1];
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-host-bindings',
          severity: 'error',
          category: 'maintainability',
          message: `@${name} is backwards-compatible. Use the host option instead.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            "Move the binding into the host object of @Component or @Directive, for example '[class.active]': 'isActive()' or '(keydown)': 'updateValue($event)'.",
          docsUrl: DOCS_URL,
        },
        i++,
      ),
    );
  }
  return findings;
}

export const HOST_RULES = [rulePreferHostBindings] as const;
