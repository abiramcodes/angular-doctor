import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { controlFlowSpans, isTemplateSource } from './parse.js';

const CONTENT_DOCS = 'https://angular.dev/guide/components/content-projection';

export function ruleNgContentInControlFlow(ctx: RuleContext): Diagnostic[] {
  if (!isTemplateSource(ctx.file)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const seen = new Set<number>();
  let i = 0;
  for (const span of controlFlowSpans(ctx.content)) {
    const re = /<ng-content\b/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(span.text)) !== null) {
      const index = span.start + match.index;
      if (seen.has(index)) {
        continue;
      }
      seen.add(index);
      const pos = lineFromIndex(ctx.content, index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/ng-content-in-control-flow',
            severity: 'warning',
            category: 'correctness',
            message:
              'ng-content is inside control flow or an ng-template, so projected content is still created.',
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Project an ng-template and render it with NgTemplateOutlet.',
            docsUrl: CONTENT_DOCS,
          },
          i++,
        ),
      );
    }
  }
  return findings;
}
