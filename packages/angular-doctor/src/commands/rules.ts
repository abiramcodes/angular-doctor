import type { Command } from 'commander';
import { CATEGORIES, type Severity } from '@angular-doctor/core/types';
import { explainRule, listRuleCards, type ListedRule } from '@angular-doctor/core/rules/registry';
import { createColors } from 'picocolors';
import { parseCategory } from './categories.js';
import { colorize, type ColorRole } from './palette.js';

const pc = createColors(process.stdout.isTTY === true);

const SEVERITY_ROLE: Record<Severity, ColorRole> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export function runRulesList(category?: string): void {
  const filter = category ? parseCategory(category) : undefined;
  console.log(formatRuleList(listRuleCards(filter)));
}

export function categoryFromCommand(
  opts: { category?: string },
  command: Command,
): string | undefined {
  const globals = command.optsWithGlobals() as { category?: string };
  return opts.category ?? globals.category;
}

export function runRulesExplain(id: string): void {
  console.log(formatRuleExplanation(explainRule(id)));
}

export function formatRuleList(rules: ListedRule[]): string {
  const lines: string[] = [];
  for (const category of CATEGORIES) {
    const items = rules.filter((rule) => rule.category === category);
    if (items.length === 0) {
      continue;
    }
    const tone = category as ColorRole;
    lines.push(colorize(category, tone, true) + pc.dim(`  ${items.length}`));
    for (const rule of items) {
      lines.push(
        `  ${colorize(rule.id, tone)}  ${colorize(rule.defaultSeverity, tone)}  ${colorize(rule.title, tone)}`,
      );
      if (rule.summary) {
        lines.push(`    ${colorize(rule.summary, tone)}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

export function formatRuleExplanation(rule: ListedRule): string {
  const tone = SEVERITY_ROLE[rule.defaultSeverity];
  const lines = [
    colorize(rule.id, tone, true),
    `${pc.dim('Title')}  ${rule.title}`,
    `${pc.dim('Severity')}  ${colorize(rule.defaultSeverity, tone)}`,
    `${pc.dim('Category')}  ${colorize(rule.category, rule.category)}`,
  ];
  if (rule.summary) {
    lines.push(pc.dim(rule.summary));
  }
  if (rule.docsUrl) {
    lines.push(`${pc.dim('Docs')}  ${colorize(rule.docsUrl, 'info')}`);
  }
  return lines.join('\n');
}
