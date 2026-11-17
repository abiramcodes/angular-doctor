import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp } from '../match.js';
import { declaredSignalNames, maskCommentsAndStrings, sliceParens } from './parse.js';

const EFFECTS_DOCS = 'https://angular.dev/guide/signals/effect';

export function ruleEffectWritesState(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  // Only signals declared in this file count. A write through an injected
  // service or store (this.store.count.set(...)) propagates state owned
  // elsewhere, and side effects such as setting the tab title are what
  // effect() exists for.
  const signals = declaredSignalNames(ctx.content);
  if (signals.size === 0) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const masked = maskCommentsAndStrings(ctx.content);
  const re = /(?<![\w$.])(?:effect|afterRenderEffect)\s*\(/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(masked)) !== null) {
    const open = masked.indexOf('(', match.index);
    const span = sliceParens(ctx.content, open);
    if (!span || !writesDeclaredSignal(span.text, signals)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/effect-writes-state',
          severity: 'warning',
          category: 'correctness',
          message:
            'effect() writes a signal declared in this file with set() or update(). Prefer computed() or linkedSignal().',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Derive state with computed() or linkedSignal() instead of writing same-file signals inside an effect.',
          docsUrl: EFFECTS_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

function writesDeclaredSignal(spanText: string, signals: Set<string>): boolean {
  const masked = maskCommentsAndStrings(spanText);
  for (const name of signals) {
    const escaped = escapeRegExp(name);
    const write = new RegExp(
      `(?:\\bthis\\.${escaped}|(?<![\\w$.])${escaped})\\.(?:set|update)\\s*\\(`,
    );
    if (write.test(masked)) {
      return true;
    }
  }
  return false;
}
