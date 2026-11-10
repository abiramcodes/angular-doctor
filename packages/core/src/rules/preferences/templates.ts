import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { controlFlowSpans, isTemplateSource } from './parse.js';

const CONTENT_DOCS = 'https://angular.dev/guide/components/content-projection';
const COMPONENTS_DOCS = 'https://angular.dev/guide/components';

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

export function ruleTemplateArrowNotCalled(ctx: RuleContext): Diagnostic[] {
  if (!isTemplateSource(ctx.file)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /\(([A-Za-z][\w:.-]*)\)\s*=\s*(["'])([\s\S]*?)\2/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const expression = match[3] ?? '';
    const isHandlerArrow = /^\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(expression);
    const hasBlockBody = /=>\s*\{/.test(expression);
    if (!isHandlerArrow && !hasBlockBody) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/template-arrow-not-called',
          severity: 'warning',
          category: 'correctness',
          message: 'Template event binding uses an arrow function that does not run as a call.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Call a method, such as (click)="save()", or use an expression-bodied arrow inside a call.',
          docsUrl: COMPONENTS_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}
