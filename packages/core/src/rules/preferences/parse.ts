import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp, execAll } from '../match.js';

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

/**
 * Blank out comments and string/template literals with spaces, keeping
 * length, offsets, and newlines intact so line/column math still points
 * at the original source. TypeScript rules scan the masked text so a
 * trigger word inside a comment or string never fires a finding.
 */
export function maskCommentsAndStrings(content: string): string {
  const chars = content.split('');
  const blank = (from: number, to: number): void => {
    for (let i = from; i < to && i < chars.length; i++) {
      if (chars[i] !== '\n' && chars[i] !== '\r') {
        chars[i] = ' ';
      }
    }
  };
  let i = 0;
  while (i < content.length) {
    const ch = content[i] ?? '';
    const next = content[i + 1] ?? '';
    if (ch === '/' && next === '/') {
      const end = content.indexOf('\n', i);
      blank(i, end === -1 ? content.length : end);
      i = end === -1 ? content.length : end;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = content.indexOf('*/', i + 2);
      const stop = end === -1 ? content.length : end + 2;
      blank(i, stop);
      i = stop;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < content.length) {
        if (content[j] === '\\') {
          j += 2;
          continue;
        }
        if (content[j] === ch) {
          j += 1;
          break;
        }
        if (ch !== '`' && content[j] === '\n') {
          break;
        }
        j += 1;
      }
      blank(i, j);
      i = j;
      continue;
    }
    i += 1;
  }
  return chars.join('');
}

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
  const source = ctx.file.endsWith('.ts') ? maskCommentsAndStrings(ctx.content) : ctx.content;
  return execAll(source, options.pattern).map((match, index) => {
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
  let re: RegExp;
  try {
    re = new RegExp(`<(?:${names})\\b[^>]*>`, 'gi');
  } catch {
    return tags;
  }
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
  const match = new RegExp(`\\b${escapeRegExp(name)}\\s*\\([^)]*\\)\\s*(?::[^{]+)?\\{`).exec(
    content,
  );
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

/**
 * Names of writable signals declared in this file: class fields and
 * locals assigned signal(), model(), or linkedSignal(). Signals reached
 * through injected services or imports are deliberately not included.
 */
export function declaredSignalNames(content: string): Set<string> {
  const masked = maskCommentsAndStrings(content);
  const names = new Set<string>();
  const factory = '(?:signal|model|linkedSignal)';
  const patterns = [
    new RegExp(
      `(?:^|[;{\\n])\\s*(?:(?:public|private|protected|readonly|static|declare)\\s+)*([A-Za-z_$][\\w$]*)\\s*(?::[^=;\\n]+)?=\\s*${factory}\\b`,
      'g',
    ),
    new RegExp(
      `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*(?::[^=;]+)?=\\s*${factory}\\b`,
      'g',
    ),
  ];
  for (const re of patterns) {
    for (const match of execAll(masked, re)) {
      if (match[1]) {
        names.add(match[1]);
      }
    }
  }
  return names;
}

/**
 * True when `name` is declared in this file (variable, field, parameter,
 * or destructuring), so uses of it do not resolve to a global.
 */
export function isDeclaredInFile(content: string, name: string): boolean {
  const masked = maskCommentsAndStrings(content);
  const escaped = escapeRegExp(name);
  const patterns = [
    new RegExp(`\\b(?:const|let|var)\\s+${escaped}\\b`),
    new RegExp(
      `(?:^|[;{\\n])\\s*(?:(?:public|private|protected|readonly|static|declare)\\s+)+${escaped}\\b`,
    ),
    new RegExp(`[(,]\\s*(?:(?:public|private|protected|readonly)\\s+)*${escaped}\\s*[?:,)=]`),
    new RegExp(`\\{\\s*${escaped}\\b[^}]*\\}\\s*=`),
    new RegExp(`\\b${escaped}\\s*=\\s*inject\\b`),
  ];
  return patterns.some((re) => re.test(masked));
}

export function sliceDelimited(
  content: string,
  open: number,
  start: string,
  end: string,
): Span | null {
  // Count delimiters on masked text so brackets inside strings or
  // comments do not truncate or overrun the span.
  const masked = maskCommentsAndStrings(content);
  let depth = 0;
  for (let i = open; i < content.length; i++) {
    const ch = masked[i];
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
