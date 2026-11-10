import type { Category, Severity } from '../types.js';

export const STYLE_GUIDE_URL = 'https://angular.dev/style-guide';
export const RULE_CATALOG_VERSION = '1';

export interface RuleCatalogEntry {
  ruleId: string;
  title: string;
  styleGuideUrl: string;
  category: Category;
  defaultSeverity: Severity;
  styleGuideOnly?: boolean;
}

const entries: RuleCatalogEntry[] = [
  {
    ruleId: 'angular-doctor/file-hyphen-case',
    title: 'Hyphenated file names',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/missing-spec-file',
    title: 'Missing spec file',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/filename-class-mismatch',
    title: 'Filename class mismatch',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/component-file-set-mismatch',
    title: 'Component file set mismatch',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/generic-filename',
    title: 'Generic file name',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/naming-convention-mix',
    title: 'Mixed naming conventions',
    styleGuideUrl: `${STYLE_GUIDE_URL}#naming`,
    category: 'hygiene',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/project-layout',
    title: 'Project layout',
    styleGuideUrl: `${STYLE_GUIDE_URL}#project-structure`,
    category: 'hygiene',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/type-based-folder',
    title: 'Type-based folder',
    styleGuideUrl: `${STYLE_GUIDE_URL}#project-structure`,
    category: 'hygiene',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/one-concept-per-file',
    title: 'One concept per file',
    styleGuideUrl: `${STYLE_GUIDE_URL}#project-structure`,
    category: 'maintainability',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/prefer-readonly-signals',
    title: 'Readonly signal APIs',
    styleGuideUrl: `${STYLE_GUIDE_URL}#components-and-directives`,
    category: 'maintainability',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/lifecycle-interface',
    title: 'Lifecycle interface',
    styleGuideUrl: `${STYLE_GUIDE_URL}#components-and-directives`,
    category: 'maintainability',
    defaultSeverity: 'warning',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/lifecycle-hook-complexity',
    title: 'Lifecycle hook complexity',
    styleGuideUrl: `${STYLE_GUIDE_URL}#components-and-directives`,
    category: 'maintainability',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/member-order',
    title: 'Member order',
    styleGuideUrl: `${STYLE_GUIDE_URL}#components-and-directives`,
    category: 'maintainability',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/generic-event-handler',
    title: 'Generic event handler name',
    styleGuideUrl: `${STYLE_GUIDE_URL}#components-and-directives`,
    category: 'maintainability',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
  {
    ruleId: 'angular-doctor/template-complexity',
    title: 'Template complexity',
    styleGuideUrl: 'https://angular.dev/guide/templates/expression-syntax',
    category: 'maintainability',
    defaultSeverity: 'info',
    styleGuideOnly: true,
  },
];

const byRuleId = new Map(entries.map((e) => [e.ruleId, e]));

export function getCatalogEntry(ruleId: string): RuleCatalogEntry | undefined {
  return byRuleId.get(ruleId);
}

export function isStyleGuideOnlyRule(ruleId: string): boolean {
  return getCatalogEntry(ruleId)?.styleGuideOnly === true;
}

export function getStyleGuideUrl(ruleId: string): string | undefined {
  return getCatalogEntry(ruleId)?.styleGuideUrl;
}
