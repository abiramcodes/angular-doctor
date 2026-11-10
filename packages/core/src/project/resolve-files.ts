import { execSync } from 'node:child_process';
import { relative } from 'node:path';
import fg from 'fast-glob';
import type { ScanOptions } from '../types.js';

const SOURCE_GLOBS = ['**/*.ts', '**/*.html'] satisfies string[];
const SOURCE_EXTENSION = /\.(ts|html)$/;

const IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.angular/**',
  '**/coverage/**',
  '**/*.spec.ts',
] as const;

function gitChangedFiles(cwd: string): string[] {
  try {
    const out = execSync('git diff --name-only HEAD', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) {
      const staged = execSync('git diff --cached --name-only', {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return staged ? staged.split('\n').filter(Boolean) : [];
    }
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export async function resolveScanFiles(
  projectRoot: string,
  options: ScanOptions,
): Promise<string[]> {
  const extraIgnore = options.config?.ignore ?? [];

  if (options.scope === 'files' && options.files?.length) {
    return options.files
      .map((f) => (f.startsWith('/') ? f : `${projectRoot}/${f}`))
      .filter(isSourceFile);
  }

  if (options.scope === 'changed') {
    const changed = gitChangedFiles(projectRoot).filter(isSourceFile);
    if (changed.length > 0) {
      return changed.map((f) => `${projectRoot}/${f}`);
    }
  }

  const files = await fg(SOURCE_GLOBS, {
    cwd: projectRoot,
    absolute: true,
    ignore: [...IGNORE, ...extraIgnore],
    dot: false,
  });

  if (options.scope === 'contextual' && options.files?.length) {
    const seeds = new Set(
      options.files.map((f) => (f.startsWith(projectRoot) ? f : `${projectRoot}/${f}`)),
    );
    return files.filter((f) => {
      const rel = relative(projectRoot, f);
      return [...seeds].some(
        (seed) => f === seed || rel.startsWith(relative(projectRoot, seed).split('/')[0] ?? ''),
      );
    });
  }

  return files;
}

export function partitionByExtension(files: string[]): {
  typescript: string[];
  html: string[];
} {
  const typescript: string[] = [];
  const html: string[] = [];
  for (const file of files) {
    if (file.endsWith('.html')) {
      html.push(file);
    } else if (file.endsWith('.ts')) {
      typescript.push(file);
    }
  }
  return { typescript, html };
}

function isSourceFile(file: string): boolean {
  return SOURCE_EXTENSION.test(file) && !file.endsWith('.spec.ts');
}
