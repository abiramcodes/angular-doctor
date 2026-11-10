import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp } from '../match.js';
import type { Diagnostic } from '../../types.js';

const LIFECYCLE_HOOKS = [
  'ngOnInit',
  'ngOnChanges',
  'ngOnDestroy',
  'ngAfterViewInit',
  'ngAfterContentInit',
  'ngDoCheck',
] as const;

const LIFECYCLE_INTERFACE: Record<string, string> = {
  ngOnInit: 'OnInit',
  ngOnChanges: 'OnChanges',
  ngOnDestroy: 'OnDestroy',
  ngAfterViewInit: 'AfterViewInit',
  ngAfterContentInit: 'AfterContentInit',
  ngDoCheck: 'DoCheck',
};

const SIGNAL_APIS =
  /\b(userId|title|\w+)\s*=\s*(input|model|output|viewChild|contentChild|viewChildren|contentChildren)\s*\(/;

export function rulePreferReadonlySignals(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings = [];
  const re =
    /^\s*(?!readonly\b)(\w+)\s*=\s*(input|model|output|viewChild|contentChild|viewChildren|contentChildren)\s*(?:<[^>]+>)?\s*\(/gm;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-readonly-signals',
          severity: 'warning',
          category: 'maintainability',
          message: `Signal API "${match[2]}" should be readonly.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Declare as readonly so Angular-owned fields are not reassigned.',
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleLifecycleInterface(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !/@Component\s*\(/.test(ctx.content)) {
    return [];
  }
  const implementsBlock = ctx.content.match(/implements\s+([\w,\s]+)/);
  const implemented = new Set(
    (implementsBlock?.[1] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const findings = [];
  let i = 0;
  for (const hook of LIFECYCLE_HOOKS) {
    if (!new RegExp(`\\b${escapeRegExp(hook)}\\s*\\(`).test(ctx.content)) {
      continue;
    }
    const iface = LIFECYCLE_INTERFACE[hook];
    if (!iface || implemented.has(iface)) {
      continue;
    }
    const index = ctx.content.indexOf(hook);
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/lifecycle-interface',
          severity: 'warning',
          category: 'maintainability',
          message: `${hook} is declared but class does not implement ${iface}.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: `Add implements ${iface} and import it from @angular/core.`,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleLifecycleHookComplexity(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts')) {
    return [];
  }
  const findings = [];
  let i = 0;
  for (const hook of LIFECYCLE_HOOKS) {
    const re = new RegExp(`${escapeRegExp(hook)}\\s*\\([^)]*\\)\\s*\\{`, 'g');
    const match = re.exec(ctx.content);
    if (!match) {
      continue;
    }
    const start = match.index + match[0].length;
    const body = extractBracedBlock(ctx.content, start - 1);
    if (!body) {
      continue;
    }
    const lineCount = body.split('\n').length;
    if (lineCount <= 15) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/lifecycle-hook-complexity',
          severity: 'info',
          category: 'maintainability',
          message: `${hook} contains ${lineCount} lines; prefer delegating to named methods.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Call small private methods from the lifecycle hook.',
        },
        i++,
      ),
    );
  }
  return findings;
}

function extractBracedBlock(content: string, openIndex: number): string | null {
  if (content[openIndex] !== '{') {
    return null;
  }
  let depth = 0;
  for (let i = openIndex; i < content.length; i++) {
    if (content[i] === '{') {
      depth += 1;
    } else if (content[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openIndex + 1, i);
      }
    }
  }
  return null;
}

export function ruleMemberOrder(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !/@Component\s*\(/.test(ctx.content)) {
    return [];
  }
  const classMatch = ctx.content.match(/export\s+class\s+\w+[^{]*\{/);
  if (!classMatch) {
    return [];
  }
  const classBodyStart = classMatch.index! + classMatch[0].length;
  const classBody = ctx.content.slice(classBodyStart);
  const signalMatch = SIGNAL_APIS.exec(classBody);
  const methodMatch = /\n\s*(?:public|private|protected)?\s*\w+\s*\([^)]*\)\s*\{/.exec(classBody);
  if (!signalMatch || !methodMatch) {
    return [];
  }
  if (methodMatch.index! >= signalMatch.index!) {
    return [];
  }
  return [
    diag({
      ruleId: 'angular-doctor/member-order',
      severity: 'info',
      category: 'maintainability',
      message: 'A method appears before Angular signal or query fields.',
      file: ctx.file,
      line: 1,
      column: 1,
      suggestion: 'Group inject, input, output, and queries before instance methods.',
    }),
  ];
}

export const COMPONENT_CLASS_RULES = [
  rulePreferReadonlySignals,
  ruleLifecycleInterface,
  ruleLifecycleHookComplexity,
  ruleMemberOrder,
] as const;
