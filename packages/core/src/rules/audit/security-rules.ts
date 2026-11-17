import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';
import { maskCommentsAndStrings } from '../preferences/parse.js';
import { openingTags } from './tags.js';

const SECURITY_DOCS = 'https://angular.dev/best-practices/security';

export function ruleInnerHtml(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  const push = (index: number, message: string): void => {
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/inner-html',
          severity: 'warning',
          category: 'security',
          message,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          docsUrl: SECURITY_DOCS,
        },
        findings.length,
      ),
    );
  };
  // Direct DOM assignment is never sanitized by Angular.
  for (const match of execAll(ctx.content, /\.innerHTML\s*\+?=/g)) {
    push(match.index, 'Direct innerHTML assignment skips Angular sanitization. Bind text instead.');
  }
  // A [innerHTML] binding runs through Angular's sanitizer, which is the
  // correct setup for rendered markup such as markdown. It only becomes
  // a finding when this file bypasses that sanitizer.
  const scoped = ctx.file.endsWith('.ts') ? maskCommentsAndStrings(ctx.content) : ctx.content;
  if (/bypassSecurityTrust/.test(scoped)) {
    for (const match of execAll(ctx.content, /\[innerHTML\]|bind-innerHTML/g)) {
      push(
        match.index,
        '[innerHTML] is fed by a sanitizer bypass in this file. Review the bypassSecurityTrust* call.',
      );
    }
  }
  return findings;
}

export function ruleTargetBlank(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const { tag, index } of openingTags(ctx.content)) {
    if (!isBlankTarget(tag) || hasSafeRel(tag)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/target-blank',
          severity: 'warning',
          category: 'security',
          message: 'target="_blank" needs rel="noopener" or rel="noreferrer".',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          docsUrl: SECURITY_DOCS,
        },
        findings.length,
      ),
    );
  }
  return findings;
}

function isBlankTarget(tag: string): boolean {
  return (
    /target\s*=\s*['"]_blank['"]/.test(tag) || /\[target\]\s*=\s*['"]['"]_blank['"]['"]/.test(tag)
  );
}

function hasSafeRel(tag: string): boolean {
  // A bound [rel] cannot be evaluated statically, so it counts as handled.
  return /\[rel\]|bind-rel|\[attr\.rel\]/.test(tag) || /noopener|noreferrer/.test(tag);
}
