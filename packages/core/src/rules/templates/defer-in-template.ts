import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { resolveTemplate } from './for-allocation.js';

const DOCS_URL = 'https://angular.dev/guide/components/defer';

export function ruleDeferWithoutTrigger(ctx: RuleContext): Diagnostic[] {
  const resolved = resolveTemplate(ctx);
  if (!resolved) {
    return [];
  }
  const { source } = resolved;
  const findings: Diagnostic[] = [];
  let i = 0;
  const deferRe = /@defer\b/g;
  let match: RegExpExecArray | null;
  while ((match = deferRe.exec(source.text)) !== null) {
    const start = match.index;
    const open = source.text.indexOf('{', start);
    const header =
      open === -1 ? source.text.slice(start, start + 300) : source.text.slice(start, open);
    const trigger =
      /\b(on|when)\b/.test(header) || header.includes('prefetch') || /\bhydrate\b/.test(header);
    if (trigger) {
      continue;
    }
    const pos = lineFromIndex(source.content, source.offset + start);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/defer-missing-trigger',
          severity: 'warning',
          category: 'performance',
          message: '@defer has no trigger. It renders immediately, so the split buys nothing.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Add a trigger such as @defer (on viewport) or @defer (when condition), or remove @defer if the content must render now.',
          docsUrl: DOCS_URL,
        },
        i++,
      ),
    );
  }
  return findings;
}
