import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { classIndex, resolveTemplate } from './for-allocation.js';

const DOCS_URL = 'https://angular.dev/best-practices/runtime-performance';

interface Segment {
  text: string;
  /** Index of `text` inside the template text. */
  offset: number;
}

/** Expression-bearing parts of a template: interpolations, bindings, control flow. */
function expressionSegments(template: string): Segment[] {
  const segments: Segment[] = [];
  const patterns = [
    /\{\{([\s\S]*?)\}\}/g,
    /[\w[\]()*.@-]+\s*=\s*"([^"]*)"/g,
    /[\w[\]()*.@-]+\s*=\s*'([^']*)'/g,
    /@(?:if|for|switch|let|defer)\b[^{;]*/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(template)) !== null) {
      const text = match[1] ?? match[0];
      segments.push({ text, offset: match.index + match[0].indexOf(text) });
    }
  }
  return segments;
}

export function ruleGetterInTemplate(ctx: RuleContext): Diagnostic[] {
  const resolved = resolveTemplate(ctx);
  if (!resolved) {
    return [];
  }
  const index = classIndex(resolved.classContent);
  if (index.getters.size === 0) {
    return [];
  }
  const { source } = resolved;
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const segment of expressionSegments(source.text)) {
    for (const name of index.getters) {
      const useRe = new RegExp(`(?<![\\w$.])${name}(?![\\w$])(?!\\s*\\()`, 'g');
      let use: RegExpExecArray | null;
      while ((use = useRe.exec(segment.text)) !== null) {
        const pos = lineFromIndex(source.content, source.offset + segment.offset + use.index);
        findings.push(
          diag(
            {
              ruleId: 'angular-doctor/getter-in-template',
              severity: 'error',
              category: 'performance',
              message: `Template reads getter "${name}". Getters re-run on every change detection cycle, with no caching.`,
              file: ctx.file,
              line: pos.line,
              column: pos.column,
              suggestion: `Replace the getter with a computed() and read it as ${name}() in the template, or precompute the value into a signal.`,
              docsUrl: DOCS_URL,
            },
            i++,
          ),
        );
      }
    }
  }
  return findings;
}
