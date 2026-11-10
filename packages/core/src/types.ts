export type Severity = 'error' | 'warning' | 'info';

export const CATEGORIES = [
  'correctness',
  'performance',
  'maintainability',
  'security',
  'accessibility',
  'hygiene',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ScanScope = 'full' | 'changed' | 'files' | 'contextual';

export interface Diagnostic {
  id: string;
  ruleId: string;
  severity: Severity;
  category: Category;
  message: string;
  file: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  suggestion?: string;
  docsUrl?: string;
  migrationId?: string;
  source: 'oxlint' | 'template-eslint' | 'angular-doctor';
}

export interface ProjectInfo {
  root: string;
  name: string;
  kind: 'angular-cli' | 'nx' | 'unknown';
  angularVersion: string | null;
  workspaceRoots: string[];
}

export interface AngularDoctorConfig {
  reportPath?: string;
  reportDirectory?: string;
  ignore?: string[];
  rules?: Record<string, 'off' | 'warn' | 'warning' | 'error' | 'info'>;
  styleGuide?: {
    namingConvention?: 'detect';
  };
}

export type ScanPhase =
  | 'project'
  | 'files'
  | 'rules'
  | 'typescript'
  | 'templates'
  | 'score'
  | 'report';

export interface ScanProgress {
  phase: ScanPhase;
  message: string;
  completed: number;
  total: number;
  file?: string;
  findings: number;
  score: number | null;
}

export interface ScanOptions {
  cwd: string;
  scope: ScanScope;
  files?: string[];
  verbose?: boolean;
  config?: AngularDoctorConfig;
  onProgress?: (progress: ScanProgress) => void;
}

export interface ScanTotals {
  error: number;
  warning: number;
  info: number;
  byCategory: Record<Category, number>;
}

export interface ScanResult {
  score: number;
  diagnostics: Diagnostic[];
  totals: ScanTotals;
  project: ProjectInfo;
  reportPath: string | null;
  skippedChecks: string[];
  durationMs: number;
  filesScanned: number;
  filesTotal: number;
}
