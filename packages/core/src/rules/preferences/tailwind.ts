import { readFileSync } from 'node:fs';
import fg from 'fast-glob';
import semver from 'semver';
import { diag, lineFromIndex } from '../diag-helpers.js';
import type { Diagnostic } from '../../types.js';

const TAILWIND_DOCS = 'https://tailwindcss.com/docs/upgrade-guide';

export function tailwindMajorFromPackageJson(text: string): number | null {
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const deps = pkg[section];
    if (!deps || typeof deps !== 'object' || !('tailwindcss' in deps)) {
      continue;
    }
    const raw = (deps as Record<string, unknown>).tailwindcss;
    if (typeof raw !== 'string') {
      continue;
    }
    return semver.coerce(raw.replace(/^[\^~]/, ''))?.major ?? null;
  }
  return null;
}

export function tailwindV3InStylesheet(text: string, file: string): Diagnostic[] {
  const findings: Diagnostic[] = [];
  const re = /@tailwind\s+(?:base|components|utilities)\b/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    const pos = lineFromIndex(text, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/tailwind-v3-syntax',
          severity: 'warning',
          category: 'maintainability',
          message: 'Tailwind v3 @tailwind directive. Tailwind v4 uses @import "tailwindcss".',
          file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Replace @tailwind base/components/utilities with @import "tailwindcss".',
          docsUrl: TAILWIND_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function runTailwindV3Check(projectRoot: string): Diagnostic[] {
  const ignore = ['**/node_modules/**', '**/dist/**', '**/.angular/**'];
  const packages = fg.sync('**/package.json', { cwd: projectRoot, absolute: true, ignore });
  const modern = packages.some((file) => {
    try {
      const major = tailwindMajorFromPackageJson(readFileSync(file, 'utf8'));
      return major !== null && major >= 4;
    } catch {
      return false;
    }
  });
  if (!modern) {
    return [];
  }
  const findings: Diagnostic[] = [];
  for (const file of fg.sync('**/*.{css,scss}', { cwd: projectRoot, absolute: true, ignore })) {
    try {
      findings.push(...tailwindV3InStylesheet(readFileSync(file, 'utf8'), file));
    } catch {
      continue;
    }
  }
  for (const file of fg.sync('**/tailwind.config.{js,ts,mjs,cjs}', {
    cwd: projectRoot,
    absolute: true,
    ignore,
  })) {
    findings.push(
      diag({
        ruleId: 'angular-doctor/tailwind-v3-syntax',
        severity: 'warning',
        category: 'maintainability',
        message: 'tailwind.config is a Tailwind v3 file. Tailwind v4 configures the theme in CSS.',
        file,
        line: 1,
        column: 1,
        suggestion: 'Remove tailwind.config and configure the theme with CSS variables.',
        docsUrl: TAILWIND_DOCS,
      }),
    );
  }
  return findings;
}
