import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';

export interface Span {
  text: string;
  start: number;
}

export const OUTPUT_DOM_NAMES = new Set(['click', 'submit', 'change', 'input', 'focus']);
export const INPUT_DOM_NAMES = new Set(['id', 'title', 'role', 'tabIndex', 'lang']);
export const SIGNAL_FORM_SYMBOLS = [
  'FormControl',
  'FormGroup',
  'FormArray',
  'FormBuilder',
  'NgForm',
  'FormsModule',
] as const;

export const PIPES_DOCS = 'https://angular.dev/guide/templates/pipes';

export function pipeInjection(
  ctx: RuleContext,
  index: number,
  name: string,
  id: number,
): Diagnostic {
  const pos = lineFromIndex(ctx.content, index);
  return diag(
    {
      ruleId: 'angular-doctor/inject-pipe',
      severity: 'warning',
      category: 'maintainability',
      message: `${name} is injected. Pipes are template operators, not services.`,
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Call formatDate, formatNumber, or the other @angular/common format functions.',
      docsUrl: PIPES_DOCS,
    },
    id,
  );
}

export function identifierFindings(
  ctx: RuleContext,
  options: {
    ruleId: string;
    pattern: RegExp;
    message: string;
    suggestion: string;
    docsUrl: string;
    severity?: 'warning' | 'info';
    category?: Diagnostic['category'];
  },
): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') && !ctx.file.endsWith('.html')) {
    return [];
  }
  return execAll(ctx.content, options.pattern).map((match, index) => {
    const pos = lineFromIndex(ctx.content, match.index);
    return diag(
      {
        ruleId: options.ruleId,
        severity: options.severity ?? 'warning',
        category: options.category ?? 'maintainability',
        message: options.message,
        file: ctx.file,
        line: pos.line,
        column: pos.column,
        suggestion: options.suggestion,
        docsUrl: options.docsUrl,
      },
      index,
    );
  });
}

export function pipeDecorators(ctx: RuleContext): Span[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const spans: Span[] = [];
  const re = /@Pipe\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(ctx.content)) !== null) {
    const open = ctx.content.indexOf('(', match.index);
    const span = sliceParens(ctx.content, open);
    if (span) {
      spans.push(span);
    }
  }
  return spans;
}

export function constructorParams(content: string): Span | null {
  const match = /\bconstructor\s*\(/.exec(content);
  if (!match) {
    return null;
  }
  const open = content.indexOf('(', match.index);
  return sliceParens(content, open);
}

export function elementTags(content: string, names: string): Array<{ tag: string; index: number }> {
  const tags: Array<{ tag: string; index: number }> = [];
  const re = new RegExp(`<(?:${names})\\b[^>]*>`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    tags.push({ tag: match[0], index: match.index });
  }
  return tags;
}

export function controlFlowSpans(content: string): Span[] {
  const spans: Span[] = [];
  const blockRe = /@(?:if|for|switch)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(content)) !== null) {
    const open = content.indexOf('(', match.index);
    const args = sliceParens(content, open);
    if (!args) {
      continue;
    }
    const after = args.start + args.text.length;
    const relative = content.slice(after).search(/\{/);
    if (relative < 0) {
      continue;
    }
    const body = sliceBraces(content, after + relative);
    if (body) {
      spans.push(body);
    }
  }
  const templateRe = /<ng-template\b[^>]*>/gi;
  let template: RegExpExecArray | null;
  while ((template = templateRe.exec(content)) !== null) {
    const close = content.indexOf('</ng-template>', template.index);
    if (close < 0) {
      continue;
    }
    spans.push({
      text: content.slice(template.index, close),
      start: template.index,
    });
  }
  return spans;
}

export function methodBody(content: string, name: string): Span | null {
  const match = new RegExp(`\\b${name}\\s*\\([^)]*\\)\\s*(?::[^{]+)?\\{`).exec(content);
  if (!match) {
    return null;
  }
  const brace = content.indexOf('{', match.index);
  return sliceBraces(content, brace);
}

export function isComponentOrDirective(content: string): boolean {
  return /@(?:Component|Directive)\s*\(/.test(content);
}

export function isTemplateSource(file: string): boolean {
  return file.endsWith('.ts') || file.endsWith('.html');
}

export function isDiscouragedOutputName(name: string): boolean {
  return OUTPUT_DOM_NAMES.has(name) || /^on[A-Z]/.test(name);
}

export function sliceParens(content: string, open: number): Span | null {
  return sliceDelimited(content, open, '(', ')');
}

export function sliceBraces(content: string, open: number): Span | null {
  return sliceDelimited(content, open, '{', '}');
}

export function sliceDelimited(
  content: string,
  open: number,
  start: string,
  end: string,
): Span | null {
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
