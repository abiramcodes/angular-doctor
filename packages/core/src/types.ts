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

export interface WorkspaceProject {
  name: string;
  /** Absolute project root directory. */
  root: string;
  /** Absolute source root directory (contains main.ts for applications). */
  sourceRoot: string;
  projectType?: string;
}

export type SupportTier = 'full' | 'compat' | 'unsupported';

export interface ProjectInfo {
  root: string;
  name: string;
  kind: 'angular-cli' | 'nx' | 'unknown';
  angularVersion: string | null;
  supportTier?: SupportTier;
  workspaceRoots: string[];
  /** Projects parsed from angular.json / project.json, when available. */
  projects?: WorkspaceProject[];
  /** True when any project configures SSR or prerendering. */
  hasSsr?: boolean;
  /** Absolute path scans are limited to when invoked inside one project. */
  focusRoot?: string;
}

export interface AngularDoctorConfig {
  reportPath?: string;
  reportDirectory?: string;
  ignore?: string[];
  rules?: Record<string, 'off' | 'warn' | 'warning' | 'error' | 'info'>;
  reportFormats?: ('markdown' | 'html')[];
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
  htmlReport?: boolean;
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
  supportTier?: SupportTier;
  diagnostics: Diagnostic[];
  totals: ScanTotals;
  project: ProjectInfo;
  reportPath: string | null;
  htmlReportPath?: string | null;
  skippedChecks: string[];
  durationMs: number;
  filesScanned: number;
  filesTotal: number;
}
