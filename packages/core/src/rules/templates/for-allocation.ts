import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';

const DOCS_URL = 'https://angular.dev/guide/templates/control-flow#for-block';

const SIGNAL_FACTORIES =
  '(?:signal|computed|linkedSignal|input|model|viewChild|viewChildren|contentChild|contentChildren)';
const ALLOCATING_CALL =
  /\.(?:map|filter|flatMap|concat|slice|toSorted|toReversed|reduce)\s*\(|\bArray\.from\s*\(|\bObject\.(?:keys|values|entries)\s*\(/;
const TEMPLATE_KEYWORDS = new Set(['track', 'let', 'of', 'as', 'if', 'for']);

export interface ClassIndex {
  methods: Map<string, string>;
  signals: Set<string>;
  getters: Set<string>;
}

export function classIndex(content: string): ClassIndex {
  const getters = new Set<string>();
  const getterRe =
    /(?:^|\n)[ \t]*(?:(?:public|private|protected|static)\s+)*get\s+([A-Za-z_]\w*)\s*\(/g;
  let getter: RegExpExecArray | null;
  while ((getter = getterRe.exec(content)) !== null) {
    if (getter[1]) {
      getters.add(getter[1]);
    }
  }
  const signals = new Set<string>();
  const signalRe = new RegExp(
    `(?:^|\\n)[ \\t]*(?:(?:public|private|protected|readonly|static)\\s+)*([A-Za-z_]\\w*)\\s*(?::[^=;\\n]+)?=\\s*${SIGNAL_FACTORIES}\\b`,
    'g',
  );
  let match: RegExpExecArray | null;
  while ((match = signalRe.exec(content)) !== null) {
    if (match[1]) {
      signals.add(match[1]);
    }
  }
  const methods = new Map<string, string>();
  const methodRe =
    /(?:^|\n)[ \t]*(?:(?:public|private|protected|readonly|async|override|static)\s+)*([A-Za-z_]\w*)\s*\([^)]*\)\s*(?::\s*[^{\n]+)?\{/g;
  while ((match = methodRe.exec(content)) !== null) {
    const name = match[1];
    if (!name || ['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
      continue;
    }
    const brace = content.indexOf('{', match.index);
    const body = braced(content, brace);
    if (body !== null) {
      methods.set(name, body);
    }
  }
  return { methods, signals, getters };
}

function braced(content: string, open: number): string | null {
  let depth = 0;
  for (let i = open; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(open + 1, i);
      }
    }
  }
  return null;
}

function allocates(body: string): boolean {
  return /return\s*(?:\[|\{|new\s+\w|\(\s*\[)/.test(body) || ALLOCATING_CALL.test(body);
}

export interface TemplateSource {
  text: string;
  /** Index of `text` inside `content` so line numbers point at the real file. */
  offset: number;
  content: string;
}

/** Template paired with the class source that declares it, for template rules. */
export function resolveTemplate(
  ctx: RuleContext,
): { source: TemplateSource; classContent: string } | null {
  if (ctx.file.endsWith('.ts')) {
    if (!/@Component\s*\(/.test(ctx.content)) {
      return null;
    }
    const source = templateFromTs(ctx);
    return source ? { source, classContent: ctx.content } : null;
  }
  if (ctx.file.endsWith('.html')) {
    const classContent = classContentForHtml(ctx);
    if (!classContent) {
      return null;
    }
    return { source: { text: ctx.content, offset: 0, content: ctx.content }, classContent };
  }
  return null;
}

function templateFromTs(ctx: RuleContext): TemplateSource | null {
  const inline = /template\s*:\s*`/.exec(ctx.content);
  if (inline) {
    const start = ctx.content.indexOf('`', inline.index) + 1;
    const end = ctx.content.indexOf('`', start);
    if (end > start) {
      return { text: ctx.content.slice(start, end), offset: start, content: ctx.content };
    }
  }
  const quoted = /template\s*:\s*(['"])/.exec(ctx.content);
  if (quoted) {
    const quote = quoted[1] ?? "'";
    const start = ctx.content.indexOf(quote, quoted.index) + 1;
    const end = ctx.content.indexOf(quote, start);
    if (end > start) {
      return { text: ctx.content.slice(start, end), offset: start, content: ctx.content };
    }
  }
  const url = ctx.content.match(/templateUrl\s*:\s*['"]([^'"]+)['"]/);
  if (url?.[1]) {
    try {
      const html = readFileSync(join(dirname(ctx.file), url[1]), 'utf8');
      return { text: html, offset: 0, content: html };
    } catch {
      return null;
    }
  }
  return null;
}

function classContentForHtml(ctx: RuleContext): string | null {
  const dir = dirname(ctx.file);
  const stem = basename(ctx.file, '.html').replace(/\.component$/, '');
  for (const candidate of [join(dir, `${stem}.ts`), join(dir, `${stem}.component.ts`)]) {
    if (!existsSync(candidate)) {
      continue;
    }
    try {
      const content = readFileSync(candidate, 'utf8');
      if (/@Component\s*\(/.test(content)) {
        return content;
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}

export function ruleTemplateForAllocation(ctx: RuleContext): Diagnostic[] {
  const resolved = resolveTemplate(ctx);
  if (!resolved) {
    return [];
  }
  const { source } = resolved;
  const index = classIndex(resolved.classContent);

  const findings: Diagnostic[] = [];
  let i = 0;
  const forRe = /@for\s*\(\s*[A-Za-z_$][\w$]*\s+of\s+([^;{]+?)\s*(?:;|\))/g;
  let match: RegExpExecArray | null;
  while ((match = forRe.exec(source.text)) !== null) {
    const iterable = match[1] ?? '';
    const callRe = /(?:this\.)?([A-Za-z_$][\w$]*)\s*\(/g;
    let call: RegExpExecArray | null;
    while ((call = callRe.exec(iterable)) !== null) {
      const callee = call[1] ?? '';
      if (!callee || TEMPLATE_KEYWORDS.has(callee) || index.signals.has(callee)) {
        continue;
      }
      const body = index.methods.get(callee);
      if (!body || !allocates(body)) {
        continue;
      }
      const pos = lineFromIndex(source.content, source.offset + match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/template-for-allocation',
            severity: 'info',
            category: 'performance',
            message: `@for iterates ${callee}(), which builds a new array or object per call. A fresh identity on every check defeats tracking.`,
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: `Hoist ${callee}() into a computed() so the iterable keeps a stable reference between checks.`,
            docsUrl: DOCS_URL,
          },
          i++,
        ),
      );
    }
  }
  return findings;
}
