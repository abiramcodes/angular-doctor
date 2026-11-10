import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, majorVersion, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';

const ZONELESS_DOCS = 'https://angular.dev/guide/zoneless';
const STYLING_DOCS = 'https://angular.dev/guide/components/styling';
const STRICT_DOCS = 'https://www.typescriptlang.org/tsconfig/strict.html';
const TEMPLATE_DOCS = 'https://angular.dev/tools/cli/template-typecheck';
const DEP_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

export function ruleNgDeep(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const match of execAll(ctx.content, /(?:::ng-deep|\/deep\/)/g)) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/ng-deep',
          severity: 'warning',
          category: 'maintainability',
          message: '::ng-deep pierces view encapsulation and breaks when styles move.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Style the host element, or pass a class in from the parent.',
          docsUrl: STYLING_DOCS,
        },
        findings.length,
      ),
    );
  }
  if (/\.(?:css|scss|less)$/.test(ctx.file)) {
    for (const match of execAll(ctx.content, />>>/g)) {
      const pos = lineFromIndex(ctx.content, match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/ng-deep',
            severity: 'warning',
            category: 'maintainability',
            message: '>>> is the old form of ::ng-deep and pierces view encapsulation.',
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Style the host element, or pass a class in from the parent.',
            docsUrl: STYLING_DOCS,
          },
          findings.length,
        ),
      );
    }
  }
  return findings;
}

export function runZoneJsCheck(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 20) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const packageJson = join(ctx.project.root, 'package.json');
  if (existsSync(packageJson)) {
    let text = '';
    try {
      text = readFileSync(packageJson, 'utf8');
    } catch {
      text = '';
    }
    if (packageListsZone(text)) {
      const index = text.indexOf('"zone.js"');
      const pos = index >= 0 ? lineFromIndex(text, index) : { line: 1, column: 1 };
      findings.push(
        diag({
          ruleId: 'angular-doctor/zone-js',
          severity: 'warning',
          category: 'performance',
          message:
            'zone.js is still a dependency. Angular 20+ can run zoneless and drop this runtime.',
          file: packageJson,
          line: pos.line,
          column: pos.column,
          suggestion: 'Provide zoneless change detection and remove zone.js.',
          docsUrl: ZONELESS_DOCS,
        }),
      );
    }
  }
  for (const file of ctx.files ?? []) {
    let text: string;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const match = /import\s+['"]zone\.js(?:\/[^'"]*)?['"]/.exec(text);
    if (!match) {
      continue;
    }
    const pos = lineFromIndex(text, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/zone-js',
          severity: 'warning',
          category: 'performance',
          message: 'This file imports zone.js. Zoneless apps do not need that import.',
          file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Remove the zone.js import after switching the app to zoneless.',
          docsUrl: ZONELESS_DOCS,
        },
        findings.length,
      ),
    );
  }
  return findings;
}

export function runStrictCheck(ctx: RuleContext): Diagnostic[] {
  const entry = ['tsconfig.app.json', 'tsconfig.json']
    .map((name) => join(ctx.project.root, name))
    .find((file) => existsSync(file));
  if (!entry) {
    return [];
  }
  const resolved = resolveTsConfig(entry);
  if (!resolved) {
    return [];
  }
  const findings: Diagnostic[] = [];
  if (resolved.strict !== true) {
    findings.push(
      diag({
        ruleId: 'angular-doctor/typescript-strict',
        severity: 'warning',
        category: 'correctness',
        message: 'TypeScript strict is off, so null and implicit any errors do not fail the build.',
        file: entry,
        line: 1,
        column: 1,
        suggestion: 'Set "compilerOptions.strict" to true.',
        docsUrl: STRICT_DOCS,
      }),
    );
  }
  if (resolved.strictTemplates !== true) {
    findings.push(
      diag({
        ruleId: 'angular-doctor/strict-templates',
        severity: 'warning',
        category: 'correctness',
        message: 'Angular template type-checking is off, so template bugs compile.',
        file: entry,
        line: 1,
        column: 1,
        suggestion: 'Set "angularCompilerOptions.strictTemplates" to true.',
        docsUrl: TEMPLATE_DOCS,
      }),
    );
  }
  return findings;
}

function packageListsZone(text: string): boolean {
  try {
    const pkg = JSON.parse(text) as Record<string, unknown>;
    return DEP_SECTIONS.some((section) => {
      const deps = pkg[section];
      return deps !== null && typeof deps === 'object' && 'zone.js' in deps;
    });
  } catch {
    return text.includes('"zone.js"');
  }
}

function resolveTsConfig(
  file: string,
  seen = new Set<string>(),
): { strict?: boolean; strictTemplates?: boolean } | null {
  const absolute = resolve(file);
  if (seen.has(absolute) || !existsSync(absolute)) {
    return null;
  }
  seen.add(absolute);
  const parsed = parseJsonConfig(readFileSync(absolute, 'utf8'));
  if (!parsed) {
    return null;
  }
  const base =
    typeof parsed.extends === 'string'
      ? resolveTsConfig(resolveExtends(absolute, parsed.extends), seen)
      : null;
  const compilerOptions = asRecord(parsed.compilerOptions);
  const angularCompilerOptions = asRecord(parsed.angularCompilerOptions);
  return {
    strict: compilerOptions?.strict === undefined ? base?.strict : compilerOptions.strict === true,
    strictTemplates:
      angularCompilerOptions?.strictTemplates === undefined
        ? base?.strictTemplates
        : angularCompilerOptions.strictTemplates === true,
  };
}

function resolveExtends(fromFile: string, specifier: string): string {
  const base = specifier.endsWith('.json') ? specifier : `${specifier}.json`;
  return resolve(dirname(fromFile), base);
}

function parseJsonConfig(text: string): Record<string, unknown> | null {
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}
