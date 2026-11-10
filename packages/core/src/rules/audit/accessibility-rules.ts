import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { attr, openingTags } from './tags.js';

const A11Y_DOCS = 'https://angular.dev/guide/accessibility';

export function ruleImgAlt(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const { tag, index } of openingTags(ctx.content)) {
    if (!/^<img\b/i.test(tag)) {
      continue;
    }
    if (attr(tag, 'alt') !== null || attr(tag, 'aria-hidden') === 'true') {
      continue;
    }
    findings.push(
      a11y(ctx, 'angular-doctor/img-alt', 'Image is missing alt text.', index, findings.length),
    );
  }
  return findings;
}

export function ruleClickWithoutKeyboard(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const { tag, index } of openingTags(ctx.content)) {
    if (!/^<(?:div|span|section|article)\b/i.test(tag)) {
      continue;
    }
    if (!/\(click\)/.test(tag) || /\((?:keydown|keyup|keypress)/.test(tag)) {
      continue;
    }
    findings.push(
      a11y(
        ctx,
        'angular-doctor/click-without-keyboard',
        'Click handler on a non-interactive element has no keyboard handler.',
        index,
        findings.length,
      ),
    );
  }
  return findings;
}

export function rulePositiveTabindex(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const { tag, index } of openingTags(ctx.content)) {
    const value = tabindexValue(tag);
    if (value === null || value <= 0) {
      continue;
    }
    findings.push(
      a11y(
        ctx,
        'angular-doctor/positive-tabindex',
        `tabindex ${value} overrides the natural tab order.`,
        index,
        findings.length,
      ),
    );
  }
  return findings;
}

export function ruleControlMissingLabel(ctx: RuleContext): Diagnostic[] {
  const tags = openingTags(ctx.content);
  const labelled = new Set<string>();
  for (const { tag } of tags) {
    if (!/^<label\b/i.test(tag)) {
      continue;
    }
    const id = attr(tag, 'for');
    if (id) {
      labelled.add(id);
    }
  }
  const findings: Diagnostic[] = [];
  for (const { tag, index } of tags) {
    if (!/^<(?:input|textarea|select)\b/i.test(tag)) {
      continue;
    }
    if (attr(tag, 'type')?.toLowerCase() === 'hidden') {
      continue;
    }
    const label = attr(tag, 'aria-label');
    const labelledBy = attr(tag, 'aria-labelledby');
    const id = attr(tag, 'id');
    if (
      (label && label.length > 0) ||
      (labelledBy && labelledBy.length > 0) ||
      (id && labelled.has(id))
    ) {
      continue;
    }
    findings.push(
      a11y(
        ctx,
        'angular-doctor/control-missing-label',
        'Form control has no label, aria-label, or aria-labelledby.',
        index,
        findings.length,
      ),
    );
  }
  return findings;
}

function tabindexValue(tag: string): number | null {
  const match =
    /\[tabindex\]\s*=\s*['"]['"](-?\d+)['"]['"]/.exec(tag) ??
    /\[tabindex\]\s*=\s*['"](-?\d+)['"]/.exec(tag) ??
    /\btabindex\s*=\s*['"](-?\d+)['"]/i.exec(tag);
  if (!match?.[1]) {
    return null;
  }
  return Number(match[1]);
}

function a11y(
  ctx: RuleContext,
  ruleId: string,
  message: string,
  index: number,
  findingIndex: number,
): Diagnostic {
  const pos = lineFromIndex(ctx.content, index);
  return diag(
    {
      ruleId,
      severity: 'warning',
      category: 'accessibility',
      message,
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      docsUrl: A11Y_DOCS,
    },
    findingIndex,
  );
}
