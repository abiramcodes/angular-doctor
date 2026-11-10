import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { identifierFindings, isComponentOrDirective, methodBody } from './parse.js';

const SSR_DOCS = 'https://angular.dev/guide/ssr';
const DEV_MODE_DOCS = 'https://angular.dev/api/core/isDevMode';
const QUERIES_DOCS = 'https://angular.dev/guide/components/queries';
const HOST_DOCS = 'https://angular.dev/guide/components/host-elements';

export function rulePreferDocumentToken(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !isComponentOrDirective(ctx.content)) {
    return [];
  }
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/prefer-document-token',
    pattern: /(?<![\w.])document\./g,
    severity: 'info',
    category: 'correctness',
    message: 'Global document is used in a component or directive.',
    suggestion: 'Inject DOCUMENT from @angular/common instead of the global document.',
    docsUrl: SSR_DOCS,
  });
}

export function rulePreferIsDevMode(ctx: RuleContext): Diagnostic[] {
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/prefer-is-dev-mode',
    pattern: /\benvironment\.production\b/g,
    severity: 'info',
    message: 'environment.production is a manual build flag.',
    suggestion: 'Use isDevMode() from @angular/core.',
    docsUrl: DEV_MODE_DOCS,
  });
}

export function ruleQueryInLifecycle(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !isComponentOrDirective(ctx.content)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const name of ['ngAfterViewInit', 'ngAfterContentInit'] as const) {
    const body = methodBody(ctx.content, name);
    if (!body || !/\b(?:viewChild|viewChildren|contentChild|contentChildren)\b/.test(body.text)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, body.start);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/query-in-lifecycle',
          severity: 'info',
          category: 'maintainability',
          message: `${name} reads a signal query. Prefer computed().`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Derive query state with computed() instead of reading it in a lifecycle hook.',
          docsUrl: QUERIES_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleHostViaElementRef(ctx: RuleContext): Diagnostic[] {
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/host-via-element-ref',
    pattern: /nativeElement\s*\??\.\s*(?:classList|style|setAttribute)\b/g,
    severity: 'info',
    message: 'Host classes, styles, or attributes are set through nativeElement.',
    suggestion: 'Bind them in the host option of @Component or @Directive.',
    docsUrl: HOST_DOCS,
  });
}
