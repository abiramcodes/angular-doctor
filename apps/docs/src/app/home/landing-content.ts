export const runCommand = 'npx @abiramcodes/angular-doctor@latest';

export type PaletteId = 'default' | 'pastel' | 'velvet';

export type PaletteRole =
  | 'error'
  | 'warning'
  | 'success'
  | 'info'
  | 'report'
  | 'progress'
  | 'maintainability'
  | 'hygiene'
  | 'correctness'
  | 'security'
  | 'performance'
  | 'accessibility';

export interface TerminalToken {
  text: string;
  role?: PaletteRole;
  dim?: boolean;
  strong?: boolean;
  decorative?: boolean;
}

export interface TerminalLine {
  tokens: TerminalToken[];
  meter?: { fill: number; score: string; tone: PaletteRole };
}

export interface PaletteSwatch {
  roles: string;
  value: string;
  preview: string;
}

export interface PaletteSpec {
  id: PaletteId;
  label: string;
  summary: string;
  swatches: PaletteSwatch[];
}

/* ------------------------------------------------------------------ *
 * Landing copy
 * ------------------------------------------------------------------ */

export const hero = {
  title: 'Your Angular codebase, diagnosed.',
  lede: 'Angular Doctor scans your Angular or Nx workspace, scores it from 0 to 100, and writes a report you can fix from.',
  note: 'A real scan of the sample workspace.',
};

export const facts = [
  {
    value: '20.19+',
    label: 'Node.js',
    detail: 'The package requires this runtime or newer.',
  },
  {
    value: '12',
    label: 'Parents',
    detail: 'How far it walks looking for angular.json or nx.json.',
  },
  {
    value: '4',
    label: 'Scopes',
    detail: 'full, changed, files, and contextual.',
  },
  {
    value: 'Once',
    label: 'Per rule',
    detail: 'An error costs 1.5, a warning 0.75, a note nothing.',
  },
];

export interface DiagnosticCategory {
  category: string;
  count: number;
  body: string;
  examples: string[];
}

export const diagnostics: DiagnosticCategory[] = [
  {
    category: 'correctness',
    count: 13,
    body: 'Does the code do what it says? Control flow, subscriptions, strict mode, templates.',
    examples: ['prefer-take-until-destroyed', 'typescript-strict', 'strict-templates'],
  },
  {
    category: 'performance',
    count: 10,
    body: "Angular's runtime budget. Change detection, images, zone.js, routing.",
    examples: ['missing-for-track', 'zone-js', 'prefer-ng-optimized-image'],
  },
  {
    category: 'maintainability',
    count: 34,
    body: 'The style guide, enforced. Naming, file sets, host bindings, lifecycle, signals.',
    examples: ['one-concept-per-file', 'prefer-host-bindings', 'prefer-signal-forms'],
  },
  {
    category: 'security',
    count: 5,
    body: 'Secrets and injection. Client code, env files, innerHTML, target="_blank".',
    examples: ['client-secret', 'env-file', 'inner-html'],
  },
  {
    category: 'accessibility',
    count: 4,
    body: 'Keyboard and screen reader. Alt text, labels, focus order, click handlers.',
    examples: ['img-alt', 'control-missing-label', 'click-without-keyboard'],
  },
  {
    category: 'hygiene',
    count: 10,
    body: 'Dead weight and drift. Unused imports and exports, file naming, project layout.',
    examples: ['unused-export', 'file-hyphen-case', 'project-layout'],
  },
];

export const reportCopy = [
  'When a scan finds something, it writes a self-contained Markdown report: the score, official migrations, a fix order, and every finding with its location and, where the rule provides one, a suggested fix.',
  'The report is written for you or your agent. Re-run with --verbose --scope changed after edits and it covers only what changed.',
];

export const finding = {
  rule: 'angular-doctor/prefer-host-bindings',
  severity: 'error',
  location: 'src/app/style-violations/host-slider.ts:8',
  message: '@HostListener is backwards-compatible. Use the host option instead.',
  fixLabel: 'suggested fix',
  fix: 'Move the binding into the host object of @Component or @Directive.',
  before: `@HostListener('keydown', ['$event'])
updateValue(event: KeyboardEvent) {}`,
  after: `host: {
  '(keydown)': 'updateValue($event)',
}`,
};

export const quickCommands = [
  {
    command: 'npx @abiramcodes/angular-doctor@latest --verbose --scope changed',
    detail: 'Scan what git shows as changed. The command to run after an edit.',
  },
  {
    command: 'npx @abiramcodes/angular-doctor@latest --category security',
    detail: 'Print one category. The score is still the full scan.',
  },
  {
    command: 'npx @abiramcodes/angular-doctor@latest --json',
    detail: 'Print one JSON object for another tool to read.',
  },
  {
    command: 'npx @abiramcodes/angular-doctor@latest rules list',
    detail: 'List the built-in checks grouped by category.',
  },
  {
    command: 'npx @abiramcodes/angular-doctor@latest install',
    detail: 'Copy the agent skill into your project.',
  },
];

export const ciCommand = 'npx @abiramcodes/angular-doctor@latest ci install';

export const ciCopy =
  'Write a GitHub Actions workflow that scans pushes to main and every pull request. Add --scope changed to report local working-tree changes, or --json to feed another job.';

/* ------------------------------------------------------------------ *
 * Docs content
 * ------------------------------------------------------------------ */

export const whatItIs = [
  'Angular Doctor is a command-line health scan for an Angular CLI or Nx workspace. Run it in the project and it reads the source, prints a score from 0 to 100, and lists what it found.',
  'Each rule counts once, at its strongest severity. An error costs 1.5 points, a warning costs 0.75, and a note costs nothing. The same rule in ten files costs the same as in one file. The score never goes below 0.',
  'TypeScript and JavaScript go through Oxlint. Built-in rules cover Angular habits those linters do not: inject(), host bindings, control flow, secrets in client code, accessibility gaps, and similar checks. An HTML template ESLint runner is wired and currently skipped until its peers are enabled. The scan sits next to the lint setup you already run. It does not replace a build or your tests.',
];

export const steps = [
  {
    title: 'Find the workspace',
    body: 'It starts in the directory you pass, or the current directory, and walks up to 12 parents looking for angular.json or nx.json. If it finds neither, it stops and says no Angular workspace was detected.',
  },
  {
    title: 'Choose files',
    body: 'Full scope reads TypeScript, JavaScript, and HTML, skipping node_modules, dist, .angular, coverage, and spec files. Changed scope uses git diff against HEAD, then staged files, and scans the whole project when nothing changed. Files scope reads only the paths you pass. Contextual scope keeps files under the same top-level folder as each seed, so a seed in src/ keeps the src tree.',
  },
  {
    title: 'Check and score',
    body: 'Built-in rules run on the source, then Oxlint runs on the scripts. The score starts at 100 and subtracts once per rule. Filtering with --category changes which findings are printed. The score stays the full scan.',
  },
  {
    title: 'Print, then write',
    body: 'In a terminal, a progress line runs on stderr and clears before the summary. You then get the project, the Angular version, the duration, a health meter, and findings grouped into errors, warnings, and info. Each finding has the rule, file, line, and message. If anything was found, including a note that does not lower the score, it writes angular-doctor-report.md. A scan with no findings prints the summary and does not write that file.',
  },
];

export const requirements = [
  {
    need: 'Node.js 20.19+',
    detail: 'The angular-doctor package requires Node.js 20.19.0 or newer.',
  },
  {
    need: 'An Angular workspace',
    detail:
      'angular.json or nx.json in the directory you scan, or in a parent, up to 12 levels up.',
  },
  {
    need: 'A terminal',
    detail:
      'npx @abiramcodes/angular-doctor@latest runs a one-off scan without adding a dependency. Pass a path to scan another folder.',
  },
  {
    need: 'No extra install',
    detail:
      'Config is optional. Add angular-doctor.config.json, or an angularDoctor field in package.json, only when you want to change the report path, ignore files, or set a rule level.',
  },
];

export const configNote =
  'Those two config sources are read together. When both set the same field, package.json wins. A .ts config file is not loaded.';

export const commandGroups = [
  {
    title: 'Scan',
    rows: [
      {
        command: 'npx @abiramcodes/angular-doctor@latest',
        detail: 'Scan the current directory.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest path/to/app',
        detail: 'Scan that directory. Workspace detection still walks up to 12 parents.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --verbose --scope changed',
        detail:
          'Scan source files git shows as changed. This is the command to run after an edit. With no matching changes, it scans the whole project.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --scope files --files src/app/app.ts',
        detail: 'Read only the paths you list.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --scope contextual --files src/app/app.ts',
        detail: 'Keep files under the same top-level folder as each seed.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --category security',
        detail:
          'Print one category: correctness, performance, maintainability, security, accessibility, or hygiene. The score is still the full scan.',
      },
    ],
  },
  {
    title: 'Change the output',
    rows: [
      {
        command: 'npx @abiramcodes/angular-doctor@latest --json',
        detail:
          'Print one JSON object: score, diagnostics, totals, project, report path, skipped checks, duration, and file counts.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --score-only',
        detail: 'Print the numeric score and nothing else.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest --colors pastel',
        detail: 'Color the terminal with the pastel palette. Also accepts default or velvet.',
      },
    ],
  },
  {
    title: 'Inspect rules and migrations',
    rows: [
      {
        command: 'npx @abiramcodes/angular-doctor@latest rules list',
        detail: 'List built-in rules grouped by category.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest rules list --category accessibility',
        detail: 'List one category.',
      },
      {
        command:
          'npx @abiramcodes/angular-doctor@latest rules explain angular-doctor/client-secret',
        detail: 'Print one rule. Use the full rule id.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest migrations',
        detail:
          'Print the ng generate @angular/core migrations that match this scan. Run them with --dry-run first.',
      },
    ],
  },
  {
    title: 'Install',
    rows: [
      {
        command: 'npx @abiramcodes/angular-doctor@latest install',
        detail:
          'Copy the agent skill to .cursor/skills/angular-doctor and .agents/skills/angular-doctor. An existing skill is left in place.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest install --force',
        detail: 'Overwrite an existing skill install.',
      },
      {
        command: 'npx @abiramcodes/angular-doctor@latest ci install',
        detail: 'Write .github/workflows/angular-doctor.yml when that file is not already there.',
      },
    ],
  },
];

export const commandsIntro =
  'These are the pre-release commands. --colors works on all of them. Anything other than default, pastel, or velvet exits with an error that names those three.';

export const flags = [
  {
    flag: '[path]',
    detail: 'Project directory. Defaults to the current working directory.',
  },
  {
    flag: '--colors',
    detail: 'default, pastel, or velvet. Default is default. Applied before the command runs.',
  },
  {
    flag: '--scope',
    detail: 'full, changed, files, or contextual. Default is full.',
  },
  {
    flag: '--files',
    detail: 'Paths used by --scope files and --scope contextual.',
  },
  {
    flag: '--category',
    detail: 'Limits the printed findings. Does not change the score.',
  },
  {
    flag: '--json',
    detail: 'Print the scan result as JSON. Skips the progress line and the text summary.',
  },
  {
    flag: '--score-only',
    detail: 'Print the number. Skips the progress line and the text summary.',
  },
  {
    flag: '--verbose',
    detail:
      'Accepted on a scan. Printed findings include the rule, file, line, and message. The agent skill runs with --verbose --scope changed.',
  },
  {
    flag: '--force',
    detail: 'On install, overwrite a skill that is already present.',
  },
];

const preview: Record<PaletteId, Record<PaletteRole, string>> = {
  default: {
    error: '#ff6b6b',
    security: '#ff6b6b',
    warning: '#f2c14e',
    success: '#3ECF8E',
    performance: '#3ECF8E',
    info: '#87d7ff',
    accessibility: '#87d7ff',
    progress: '#5ee0e8',
    report: '#5ee0e8',
    correctness: '#5ee0e8',
    maintainability: '#f0a0dc',
    hygiene: '#8eb6ff',
  },
  pastel: {
    error: '#f4a7b9',
    security: '#f4a7b9',
    warning: '#f6c59a',
    maintainability: '#f6c59a',
    success: '#98d6b6',
    performance: '#98d6b6',
    info: '#93d2ea',
    report: '#93d2ea',
    correctness: '#93d2ea',
    accessibility: '#c9b6f2',
    progress: '#8fd0c6',
    hygiene: '#8fd0c6',
  },
  velvet: {
    error: '#ff6363',
    security: '#ff6363',
    warning: '#d78ec1',
    maintainability: '#d78ec1',
    hygiene: '#d78ec1',
    success: '#9495e6',
    progress: '#9495e6',
    performance: '#9495e6',
    info: '#a48cd9',
    report: '#a48cd9',
    correctness: '#a48cd9',
    accessibility: '#a48cd9',
  },
};

export const palettes: PaletteSpec[] = [
  {
    id: 'default',
    label: 'Default',
    summary:
      'Default uses your terminal’s ANSI colors. Success and performance are fixed at #3ECF8E. Notes and accessibility use xterm color 117, #87d7ff. The other chips on this page are lightened so they stay readable on the black panel.',
    swatches: [
      { roles: 'Errors, security', value: 'Terminal red', preview: preview.default.error },
      { roles: 'Warnings', value: 'Terminal yellow', preview: preview.default.warning },
      { roles: 'Success, performance', value: '#3ECF8E', preview: preview.default.success },
      { roles: 'Notes, accessibility', value: '#87d7ff', preview: preview.default.info },
      {
        roles: 'Progress, report, correctness',
        value: 'Terminal cyan',
        preview: preview.default.progress,
      },
      {
        roles: 'Maintainability',
        value: 'Terminal magenta',
        preview: preview.default.maintainability,
      },
      { roles: 'Hygiene', value: 'Terminal blue', preview: preview.default.hygiene },
    ],
  },
  {
    id: 'pastel',
    label: 'Pastel',
    summary: 'Pastel uses the same hex colors in every terminal.',
    swatches: [
      { roles: 'Errors, security', value: '#f4a7b9', preview: preview.pastel.error },
      {
        roles: 'Warnings, maintainability',
        value: '#f6c59a',
        preview: preview.pastel.warning,
      },
      { roles: 'Success, performance', value: '#98d6b6', preview: preview.pastel.success },
      {
        roles: 'Notes, report, correctness',
        value: '#93d2ea',
        preview: preview.pastel.info,
      },
      { roles: 'Accessibility', value: '#c9b6f2', preview: preview.pastel.accessibility },
      { roles: 'Progress, hygiene', value: '#8fd0c6', preview: preview.pastel.progress },
    ],
  },
  {
    id: 'velvet',
    label: 'Velvet',
    summary: 'Velvet uses the same hex colors in every terminal.',
    swatches: [
      { roles: 'Errors, security', value: '#ff6363', preview: preview.velvet.error },
      {
        roles: 'Warnings, maintainability, hygiene',
        value: '#d78ec1',
        preview: preview.velvet.warning,
      },
      {
        roles: 'Success, progress, performance',
        value: '#9495e6',
        preview: preview.velvet.success,
      },
      {
        roles: 'Notes, report, correctness, accessibility',
        value: '#a48cd9',
        preview: preview.velvet.info,
      },
    ],
  },
];

export function previewColor(palette: PaletteId, role: PaletteRole): string {
  return preview[palette][role];
}

export function paletteById(id: PaletteId): PaletteSpec {
  return palettes.find((item) => item.id === id) ?? palettes[0];
}

export const sampleCaption =
  'Sample from this repo’s sample workspace, not a live scan. Angular 22.2, score 85, 3 errors, 27 warnings, 6 notes, 299 ms. One of the three errors is shown.';

export const summaryLines: TerminalLine[] = [
  { tokens: [{ text: 'angular-doctor  ·  Angular 22.2  ·  299 ms', dim: true }] },
  { tokens: [{ text: '' }] },
  {
    tokens: [],
    meter: { fill: 85, score: '85', tone: 'success' },
  },
  { tokens: [{ text: '' }] },
  {
    tokens: [
      { text: '3 errors', role: 'error' },
      { text: '   ', dim: true },
      { text: '27 warnings', role: 'warning' },
      { text: '   ', dim: true },
      { text: '6 notes', role: 'info' },
    ],
  },
  { tokens: [{ text: '' }] },
  {
    tokens: [
      { text: 'errors', role: 'error' },
      { text: '  3', dim: true },
    ],
  },
  {
    tokens: [
      { text: '  prefer-host-bindings', role: 'error' },
      { text: '  src/app/style-violations/host-slider.ts:8', dim: true },
    ],
  },
  {
    tokens: [
      {
        text: '  @HostListener is backwards-compatible. Use the host option instead.',
        dim: true,
      },
    ],
  },
  { tokens: [{ text: '' }] },
  {
    tokens: [{ text: 'Report: angular-doctor-report.md', role: 'report', strong: true }],
  },
];

export const outputIntro = [
  'A normal scan prints a text summary. --json and --score-only replace that summary. Color is added only when stdout or stderr is a terminal. A pipe, a redirect, or a CI log stays plain text.',
  'The text summary has a dim header (project, Angular major.minor, duration), a health meter, then errors, warnings, and notes. Findings follow, grouped errors, then warnings, then info. The rule id is printed without the angular-doctor/ prefix, then the file and line, then the message. When a report file was written, the last line is its path.',
];

export const reportSections = [
  'Summary: score, error count, warning count, info count, project name and kind, Angular version, and duration.',
  'Official Angular migrations, then the ng generate @angular/core commands that match this scan. Each command is shown with --dry-run first.',
  'A short fix order: migrations, style-guide findings, everything else, then a re-scan.',
  'Every finding under its category, with location, message, and a suggested fix when the rule has one.',
  'A JSON block at the end with the score, totals, and the recommended commands.',
];

export const markdownExcerpt = `# Angular Doctor report

> Self-contained findings for coding agents. Re-run \`npx @abiramcodes/angular-doctor@latest --verbose\` after fixes.

## Summary

- **Health score:** 85/100
- **Errors:** 3
- **Warnings:** 27
- **Infos:** 6
- **Project:** angular-doctor (angular-cli)
- **Angular:** 22.2.0
- **Scan duration:** 299ms

### angular-doctor/prefer-host-bindings (error)

- **Location:** \`src/app/style-violations/host-slider.ts:8:3\`
- **Message:** @HostListener is backwards-compatible. Use the host option instead.
- **Suggested fix:** Move the binding into the host object of @Component or @Directive.`;

export const excerptNote =
  'Excerpt from the sample workspace. The real file stores an absolute location, lists every finding, and includes the migration commands. A clean scan does not write this file.';

export const configExample = `{
  "reportPath": "reports/angular-doctor-report.md",
  "ignore": ["**/legacy/**"],
  "rules": {
    "angular-doctor/zone-js": "off"
  }
}`;

export const configHelp =
  'Put that JSON in angular-doctor.config.json, or under the angularDoctor key in package.json. reportPath replaces the default angular-doctor-report.md. reportDirectory sets the folder when reportPath is omitted. ignore adds glob patterns on top of the built-in skips. rules sets a rule to off, warning, error, or info. --category and --json still apply on top of this file.';
