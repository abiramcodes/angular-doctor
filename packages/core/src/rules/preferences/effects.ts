import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { sliceParens } from './parse.js';

const EFFECTS_DOCS = 'https://angular.dev/guide/signals/effect';

export function ruleEffectWritesState(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /\beffect\s*\(/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const open = ctx.content.indexOf('(', match.index);
    const span = sliceParens(ctx.content, open);
    if (!span || !/\.(?:set|update)\s*\(/.test(span.text)) {
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
            'effect() writes a signal with set() or update(). Prefer computed() or linkedSignal().',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Derive state with computed() or linkedSignal() instead of writing signals inside an effect.',
          docsUrl: EFFECTS_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}
