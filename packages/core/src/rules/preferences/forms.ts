import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { elementTags, isTemplateSource, SIGNAL_FORM_SYMBOLS } from './parse.js';

const SIGNAL_FORMS_DOCS = 'https://angular.dev/guide/forms/signals';
const TEMPLATE_FORMS_DOCS = 'https://angular.dev/guide/forms/template-driven-forms';

export function ruleFormFieldOwnedAttrs(ctx: RuleContext): Diagnostic[] {
  if (!isTemplateSource(ctx.file)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const tag of elementTags(ctx.content, 'input|textarea|select')) {
    if (!/(?:^|[\s])(?:\[formField\]|formField)(?:=|[\s/>])/.test(tag.tag)) {
      continue;
    }
    const owned = tag.tag.match(/\[(?:disabled|readonly|value)\]/);
    if (!owned) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, tag.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/form-field-owned-attrs',
          severity: 'warning',
          category: 'correctness',
          message: `${owned[0]} is set on an element that also uses formField.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Let [formField] own disabled, readonly, and value.',
          docsUrl: SIGNAL_FORMS_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleNgModelName(ctx: RuleContext): Diagnostic[] {
  if (!isTemplateSource(ctx.file)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const tag of elementTags(ctx.content, '[A-Za-z][\\w:-]*')) {
    if (!/\[\(ngModel\)\]|\[ngModel\]|(?:^|[\s])ngModel(?:=|[\s/>])/.test(tag.tag)) {
      continue;
    }
    if (/\[name\]|(?:^|[\s/])name\s*=/.test(tag.tag)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, tag.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/ng-model-name',
          severity: 'warning',
          category: 'correctness',
          message: '[(ngModel)] is missing a name attribute.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Add name or [name] so Angular can register the control on NgForm.',
          docsUrl: TEMPLATE_FORMS_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function rulePreferSignalForms(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]@angular\/forms['"]/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  let first = -1;
  while ((match = re.exec(ctx.content)) !== null) {
    if (first < 0) {
      first = match.index;
    }
    for (const symbol of SIGNAL_FORM_SYMBOLS) {
      if (new RegExp(`\\b${symbol}\\b`).test(match[1] ?? '')) {
        found.add(symbol);
      }
    }
  }
  if (found.size === 0 || first < 0) {
    return [];
  }
  const pos = lineFromIndex(ctx.content, first);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-signal-forms',
      severity: 'info',
      category: 'maintainability',
      message: `Reactive or template-driven forms API (${[...found].join(', ')}). New forms should use signal forms.`,
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Prefer the signal forms API for new form work.',
      docsUrl: SIGNAL_FORMS_DOCS,
    }),
  ];
}
