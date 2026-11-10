import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { INPUT_DOM_NAMES, isDiscouragedOutputName } from './parse.js';

const OUTPUTS_DOCS = 'https://angular.dev/guide/components/outputs';
const INPUTS_DOCS = 'https://angular.dev/guide/components/inputs';

export function ruleOutputName(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  const fn = /(?<!\.)\boutput\s*(?:<[^;]*?>)?\s*\(\s*(['"])([^'"]+)\1/g;
  const decorator =
    /@Output\s*\(\s*(?:(['"])([^'"]+)\1)?\s*\)\s*(?:(?:public|private|protected|readonly)\s+)*(\w+)/g;
  for (const re of [fn, decorator]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(ctx.content)) !== null) {
      const name = match[2] && match[1] ? match[2] : match[3];
      if (!name || !isDiscouragedOutputName(name)) {
        continue;
      }
      const pos = lineFromIndex(ctx.content, match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/output-name',
            severity: 'info',
            category: 'maintainability',
            message: `Output name "${name}" collides with a DOM event or uses an on prefix.`,
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Use a camelCase name such as valueChanged, not onValueChanged or click.',
            docsUrl: OUTPUTS_DOCS,
          },
          i++,
        ),
      );
    }
  }
  return findings;
}

export function ruleInputDomName(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  const patterns = [
    /@Input\s*\(\s*(?:(['"])([^'"]+)\1)?\s*\)\s*(?:(?:public|private|protected|readonly)\s+)*(\w+)/g,
    /(?<!\.)\binput\s*(?:<[^;]*?>)?\s*\(\s*(['"])([^'"]+)\1/g,
    /(?:readonly\s+)?(\w+)\s*=\s*input\s*(?:<[^;]*?>)?\s*\(/g,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(ctx.content)) !== null) {
      const alias = match[2];
      const property = match[3] ?? match[1];
      const name = alias || property;
      if (!name || !INPUT_DOM_NAMES.has(name)) {
        continue;
      }
      const pos = lineFromIndex(ctx.content, match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/input-dom-name',
            severity: 'info',
            category: 'maintainability',
            message: `Input name "${name}" collides with a DOM property.`,
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Rename the input so it does not match id, title, role, tabIndex, or lang.',
            docsUrl: INPUTS_DOCS,
          },
          i++,
        ),
      );
    }
  }
  return findings;
}
