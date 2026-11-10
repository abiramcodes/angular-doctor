import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';

export function ruleLegacyStructuralDirectives(ctx: RuleContext): Diagnostic[] {
  return execAll(ctx.content, /\*(ngIf|ngFor|ngSwitch)\b/g).map((match, index) => {
    const pos = lineFromIndex(ctx.content, match.index);
    return diag(
      {
        ruleId: 'angular-doctor/prefer-control-flow',
        migrationId: 'control-flow',
        severity: 'warning',
        category: 'correctness',
        message: `Legacy structural directive *${match[1]} found. Prefer built-in control flow (@if, @for, @switch).`,
        file: ctx.file,
        line: pos.line,
        column: pos.column,
        suggestion:
          'Run the control-flow migration, then verify templates. Add track on every @for.',
      },
      index,
    );
  });
}

export function ruleMissingForTrack(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.html') && !ctx.content.includes('template:')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /@for\s*\(/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const start = match.index;
    const headerEnd = ctx.content.indexOf(') {', start);
    if (headerEnd === -1) {
      continue;
    }
    const header = ctx.content.slice(start, headerEnd);
    if (!/\btrack\b/.test(header)) {
      const pos = lineFromIndex(ctx.content, start);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/missing-for-track',
            severity: 'error',
            category: 'performance',
            message: '@for block is missing a track expression.',
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Add `track item.id` (or another stable key) in the @for signature.',
            docsUrl: 'https://angular.dev/guide/templates/control-flow#trackby',
          },
          i++,
        ),
      );
    }
  }
  return findings;
}
