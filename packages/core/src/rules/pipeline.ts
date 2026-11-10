import type { AngularDoctorConfig, Category, Diagnostic, Severity } from '../types.js';
import type { RuleContext } from './diag-helpers.js';
import { resolveRuleSeverity } from './rule-config.js';

export const PIPELINE_KINDS = [
  'style-guide',
  'modernization',
  'performance',
  'subscription',
  'host',
  'skill-preference',
  'audit',
] as const;

export type PipelineKind = (typeof PIPELINE_KINDS)[number];

export interface RuleCard {
  id: string;
  title: string;
  summary?: string;
  defaultSeverity: Severity;
  category: Category;
  docsUrl?: string;
  styleGuideUrl?: string;
  migrationId?: string;
}

export interface PipelineStep {
  kind: PipelineKind;
  reach: 'file' | 'project';
  dedupe?: 'message';
  rules: readonly RuleCard[];
  run: (ctx: RuleContext) => Diagnostic[];
}

export function step(value: PipelineStep): PipelineStep {
  if (value.rules.length === 0) {
    throw new Error(`Pipeline step ${value.kind} has no rule cards.`);
  }
  return value;
}

export function definePipeline(steps: readonly PipelineStep[]): readonly PipelineStep[] {
  const seen = new Set<string>();
  let lastKind: PipelineKind | null = null;
  const closed = new Set<PipelineKind>();
  for (const item of steps) {
    if (closed.has(item.kind)) {
      throw new Error(`Pipeline kind ${item.kind} appears in two spans.`);
    }
    if (lastKind !== null && item.kind !== lastKind) {
      closed.add(lastKind);
    }
    lastKind = item.kind;
    for (const card of item.rules) {
      if (seen.has(card.id)) {
        throw new Error(`Pipeline rule id ${card.id} is repeated.`);
      }
      seen.add(card.id);
    }
  }
  return steps;
}

export function pipelineRuleIds(steps: readonly PipelineStep[]): string[] {
  return steps.flatMap((item) => item.rules.map((card) => card.id));
}

export function executeStep(
  item: PipelineStep,
  ctx: RuleContext,
  config: AngularDoctorConfig | undefined,
  seenMessages: Set<string>,
): Diagnostic[] {
  const allowed = new Set(item.rules.map((card) => card.id));
  const cards = new Map(item.rules.map((card) => [card.id, card]));
  const findings: Diagnostic[] = [];
  for (const diagnostic of item.run(ctx)) {
    if (!allowed.has(diagnostic.ruleId)) {
      throw new Error(`Step ${item.kind} emitted ${diagnostic.ruleId}, which is not on its cards.`);
    }
    if (item.dedupe === 'message') {
      if (seenMessages.has(diagnostic.message)) {
        continue;
      }
      seenMessages.add(diagnostic.message);
    }
    const card = cards.get(diagnostic.ruleId)!;
    const severity = resolveRuleSeverity(diagnostic.ruleId, card.defaultSeverity, config);
    if (severity === null) {
      continue;
    }
    findings.push({
      ...diagnostic,
      severity,
      category: card.category,
      migrationId: card.migrationId ?? diagnostic.migrationId,
      docsUrl: diagnostic.docsUrl ?? card.docsUrl ?? card.styleGuideUrl,
    });
  }
  return findings;
}
