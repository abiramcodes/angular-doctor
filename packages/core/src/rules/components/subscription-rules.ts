import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';

const DOCS_URL = 'https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed';

const FIELD_RE =
  /(?:^|\n)\s*(?:(?:public|private|protected|readonly|declare)\s+)*(\w+\$?)\s*(?::[^=;\n]+)?=\s*new\s+(?:Subject|BehaviorSubject)\b/;

interface SubjectField {
  name: string;
  index: number;
}

interface Span {
  text: string;
  start: number;
}

export function ruleComponentSubjects(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  if (!/@Component\s*\(/.test(ctx.content) && !/@Directive\s*\(/.test(ctx.content)) {
    return [];
  }

  const fields = subjectFields(ctx.content);
  const ngOnDestroy = methodBody(ctx.content, 'ngOnDestroy');
  const destroyCallbacks = onDestroySpans(ctx.content);
  const findings: Diagnostic[] = [];
  let i = 0;

  for (const field of fields) {
    if (!isUsed(ctx.content, field)) {
      continue;
    }
    const tornDown = firstTeardownCall(ngOnDestroy, field.name);
    if (tornDown) {
      const pos = lineFromIndex(ctx.content, ngOnDestroy!.start + tornDown.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/prefer-take-until-destroyed',
            severity: 'error',
            category: 'correctness',
            message: 'Subject teardown in ngOnDestroy. Prefer takeUntilDestroyed().',
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion:
              'Remove the destroy subject. Pipe subscriptions with takeUntilDestroyed() from @angular/core/rxjs-interop. Pass DestroyRef when the call is outside an injection context. Complete a subject you still own from DestroyRef.onDestroy(), not ngOnDestroy.',
            docsUrl: DOCS_URL,
          },
          i++,
        ),
      );
    }
    if (isCleanedUp(ngOnDestroy, destroyCallbacks, field.name)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, field.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/subject-not-cleaned-up',
          severity: 'error',
          category: 'correctness',
          message: 'Subject or BehaviorSubject is used and never completed or unsubscribed.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Subscribe with takeUntilDestroyed(), and complete the subject from DestroyRef.onDestroy() if the component still owns it.',
          docsUrl: DOCS_URL,
        },
        i++,
      ),
    );
  }

  return findings;
}

export const SUBSCRIPTION_RULES = [ruleComponentSubjects] as const;

function subjectFields(content: string): SubjectField[] {
  const fields: SubjectField[] = [];
  for (const match of execAll(content, FIELD_RE)) {
    const name = match[1];
    if (!name) {
      continue;
    }
    fields.push({ name, index: match.index + match[0].indexOf(name) });
  }
  return fields;
}

function isUsed(content: string, field: SubjectField): boolean {
  return new RegExp(`\\bthis\\.${escapeRegExp(field.name)}(?![\\w$])`).test(content);
}

function isCleanedUp(ngOnDestroy: Span | null, destroyCallbacks: Span[], name: string): boolean {
  const re = teardownPattern(name, ['complete', 'unsubscribe']);
  if (ngOnDestroy && re.test(ngOnDestroy.text)) {
    return true;
  }
  return destroyCallbacks.some((span) =>
    teardownPattern(name, ['complete', 'unsubscribe']).test(span.text),
  );
}

function firstTeardownCall(ngOnDestroy: Span | null, name: string): RegExpExecArray | null {
  if (!ngOnDestroy) {
    return null;
  }
  return teardownPattern(name, ['next', 'complete', 'unsubscribe']).exec(ngOnDestroy.text);
}

function teardownPattern(name: string, methods: string[]): RegExp {
  return new RegExp(`\\bthis\\.${escapeRegExp(name)}\\.(?:${methods.join('|')})\\s*\\(`);
}

function methodBody(content: string, name: string): Span | null {
  const match = new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*(?::[^{]+)?\\{`).exec(content);
  if (!match) {
    return null;
  }
  const brace = content.indexOf('{', match.index);
  return sliceBraces(content, brace);
}

function onDestroySpans(content: string): Span[] {
  const spans: Span[] = [];
  const re = /\.onDestroy\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const open = content.indexOf('(', match.index);
    const span = sliceParens(content, open);
    if (span) {
      spans.push(span);
    }
  }
  return spans;
}

function sliceBraces(content: string, open: number): Span | null {
  return sliceDelimited(content, open, '{', '}');
}

function sliceParens(content: string, open: number): Span | null {
  return sliceDelimited(content, open, '(', ')');
}

function sliceDelimited(content: string, open: number, start: string, end: string): Span | null {
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    const ch = content[i];
    if (ch === start) {
      depth++;
    } else if (ch === end) {
      depth--;
      if (depth === 0) {
        return { text: content.slice(open, i + 1), start: open };
      }
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
