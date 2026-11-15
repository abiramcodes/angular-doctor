import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, majorVersion, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp, execAll } from '../match.js';
import { sliceBraces } from './parse.js';

const DOCS_URL = 'https://angular.dev/api/core/injectAsync';

const LIFECYCLE = new Set([
  'constructor',
  'ngOnInit',
  'ngOnChanges',
  'ngAfterViewInit',
  'ngAfterContentInit',
  'ngDoCheck',
  'ngAfterViewChecked',
  'ngAfterContentChecked',
]);

export function ruleInjectAsyncTarget(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || majorVersion(ctx.project) < 22) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const match of execAll(
    ctx.content,
    /injectAsync\s*\([\s\S]{0,240}?import\(\s*['"]([^'"]+)['"]\s*\)/g,
  )) {
    const specifier = match[1] ?? '';
    if (!specifier.startsWith('.')) {
      continue;
    }
    const member =
      /\.then\(\s*\(?\s*[A-Za-z_$][\w$]*\s*\)?\s*=>\s*[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)/.exec(
        match[0],
      )?.[1];
    const target = readTarget(ctx.file, specifier);
    if (!target) {
      continue;
    }
    const className =
      member ?? /\bexport\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/.exec(target)?.[1];
    if (!className) {
      continue;
    }
    const classAt = target.search(
      new RegExp(
        `\\bexport\\s+(?:default\\s+)?(?:abstract\\s+)?class\\s+${escapeRegExp(className)}\\b`,
      ),
    );
    if (classAt < 0) {
      continue;
    }
    const before = target.slice(Math.max(0, classAt - 1500), classAt);
    const autoProvided =
      /@Service\s*\(/.test(before) ||
      /@Injectable\s*\(\s*\{[^}]*providedIn\s*:\s*['"]root['"]/.test(before);
    if (autoProvided) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/inject-async-target',
          severity: 'error',
          category: 'correctness',
          message: `injectAsync loads ${className}, which is not auto-provided. The lazy chunk will have no provider to resolve.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: `Decorate ${className} with @Service() or @Injectable({ providedIn: 'root' }), or inject it eagerly.`,
          docsUrl: DOCS_URL,
        },
        i++,
      ),
    );
  }
  return findings;
}

function readTarget(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = specifier.endsWith('.ts') ? [base] : [`${base}.ts`, resolve(base, 'index.ts')];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        return readFileSync(candidate, 'utf8');
      } catch {
        return null;
      }
    }
  }
  return null;
}

interface MethodSpan {
  name: string;
  start: number;
  end: number;
}

function methodSpans(content: string): MethodSpan[] {
  const spans: MethodSpan[] = [];
  const re =
    /(?:^|\n)[ \t]*(?:(?:public|private|protected|readonly|async|override|static)\s+)*([A-Za-z_]\w*)\s*\([^)]*\)\s*(?::\s*[^{\n]+)?\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const name = match[1];
    if (!name || ['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
      continue;
    }
    const brace = content.indexOf('{', match.index);
    const body = sliceBraces(content, brace);
    if (body) {
      spans.push({ name, start: body.start, end: body.start + body.text.length });
    }
  }
  return spans;
}

export function rulePreferInjectAsync(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || majorVersion(ctx.project) < 22) {
    return [];
  }
  // An external template can read the field on every change detection, so
  // only judge components whose template is visible in this file.
  if (/templateUrl\s*:/.test(ctx.content)) {
    return [];
  }
  const inlineTemplate = ctx.content.match(/template\s*:\s*`([\s\S]*?)`/)?.[1] ?? '';
  const spans = methodSpans(ctx.content);
  const findings: Diagnostic[] = [];
  let i = 0;
  const fieldRe =
    /(?:^|\n)[ \t]*(?:(?:public|private|protected|readonly|static)\s+)+([A-Za-z_]\w*)\s*(?::[^=;\n]+)?=\s*inject\(\s*([A-Z][\w$]*Service)\b/g;
  for (const match of execAll(ctx.content, fieldRe)) {
    const field = match[1] ?? '';
    const token = match[2] ?? '';
    if (!field || !token) {
      continue;
    }
    if (inlineTemplate.includes(field)) {
      continue;
    }
    const uses = execAll(
      ctx.content,
      new RegExp(`\\bthis\\.${escapeRegExp(field)}(?![\\w$])`, 'g'),
    );
    if (uses.length === 0) {
      continue;
    }
    let deferredOnly = true;
    for (const use of uses) {
      const span = spans.find((s) => use.index >= s.start && use.index <= s.end);
      if (!span || LIFECYCLE.has(span.name)) {
        deferredOnly = false;
        break;
      }
    }
    if (!deferredOnly) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-inject-async',
          severity: 'info',
          category: 'performance',
          message: `${token} is only used inside handlers. Consider injectAsync() so it loads in its own chunk on first use.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: `Replace inject(${token}) with injectAsync(() => import('...').then((m) => m.${token})) and await it where used. The service must be auto-provided.`,
          docsUrl: DOCS_URL,
        },
        i++,
      ),
    );
  }
  return findings;
}
