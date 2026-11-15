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
  // Generated reports quote rule text and sample markup; never scan them.
  '**/angular-doctor-report.html',
] as const;

interface GitChanges {
  repoRoot: string;
  files: string[];
}

function gitChangedFiles(cwd: string): GitChanges {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    // Porcelain status covers staged, unstaged, and untracked files, so a
    // brand-new component is scanned and a clean tree scans nothing. Paths
    // are repo-root relative so subdirectory scans resolve correctly.
    const out = execSync(
      'git -c status.relativePaths=false status --porcelain --untracked-files=normal',
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
    const files: string[] = [];
    for (const line of out.split('\n')) {
      if (line.length < 4) {
        continue;
      }
      let path = line.slice(3).trim();
      const renameAt = path.indexOf(' -> ');
      if (renameAt >= 0) {
        path = path.slice(renameAt + 4);
      }
      if (path.startsWith('"') && path.endsWith('"')) {
        path = path.slice(1, -1);
      }
      if (path && !path.endsWith('/')) {
        files.push(path);
      }
    }
    return { repoRoot, files };
  } catch {
    return { repoRoot: cwd, files: [] };
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
    const { repoRoot, files } = gitChangedFiles(projectRoot);
    return files
      .filter(isSourceFile)
      .map((f) => `${repoRoot}/${f}`)
      .filter((f) => f.startsWith(`${projectRoot}/`));
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
