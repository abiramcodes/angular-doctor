import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { constructorParams, pipeDecorators, pipeInjection } from './parse.js';

const PIPES_DOCS = 'https://angular.dev/guide/templates/pipes';

export function ruleImpurePipe(ctx: RuleContext): Diagnostic[] {
  return pipeDecorators(ctx).flatMap((pipe, index) => {
    if (!/pure\s*:\s*false/.test(pipe.text)) {
      return [];
    }
    const at = pipe.text.search(/pure\s*:\s*false/);
    const pos = lineFromIndex(ctx.content, pipe.start + at);
    return [
      diag(
        {
          ruleId: 'angular-doctor/impure-pipe',
          severity: 'warning',
          category: 'performance',
          message: 'Impure pipe (pure: false) runs on every change detection.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Keep the pipe pure, or move the work into a computed signal.',
          docsUrl: PIPES_DOCS,
        },
        index,
      ),
    ];
  });
}

export function rulePipeNameHyphen(ctx: RuleContext): Diagnostic[] {
  return pipeDecorators(ctx).flatMap((pipe, index) => {
    const name = pipe.text.match(/name\s*:\s*['"]([^'"]+)['"]/);
    if (!name?.[1]?.includes('-')) {
      return [];
    }
    const at = pipe.text.indexOf(name[1]);
    const pos = lineFromIndex(ctx.content, pipe.start + at);
    return [
      diag(
        {
          ruleId: 'angular-doctor/pipe-name-hyphen',
          severity: 'warning',
          category: 'maintainability',
          message: `Pipe name "${name[1]}" should be camelCase.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Use a camelCase pipe name, for example legacyDate.',
          docsUrl: PIPES_DOCS,
        },
        index,
      ),
    ];
  });
}

export function ruleInjectPipe(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /\binject\s*\(\s*(\w+Pipe)\b/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    findings.push(pipeInjection(ctx, match.index, match[1] ?? 'Pipe', i++));
  }
  const ctor = constructorParams(ctx.content);
  if (ctor) {
    const paramRe = /\b(\w+Pipe)\b/g;
    let param: RegExpExecArray | null;
    while ((param = paramRe.exec(ctor.text)) !== null) {
      findings.push(pipeInjection(ctx, ctor.start + param.index, param[1] ?? 'Pipe', i++));
    }
  }
  return findings;
}
