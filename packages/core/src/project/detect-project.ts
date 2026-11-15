import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import fg from 'fast-glob';
import semver from 'semver';
import type { ProjectInfo, SupportTier, WorkspaceProject } from '../types.js';

export function supportTierFor(version: string | null): SupportTier {
  if (!version) {
    return 'compat';
  }
  const major = Number.parseInt(version.split('.')[0] ?? '0', 10);
  if (major >= 17) {
    return 'full';
  }
  if (major >= 15) {
    return 'compat';
  }
  return 'unsupported';
}

function readAngularVersion(root: string): string | null {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) {
    return null;
  }
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const raw =
      pkg.dependencies?.['@angular/core'] ?? pkg.devDependencies?.['@angular/core'] ?? null;
    if (!raw) {
      return null;
    }
    const coerced = semver.coerce(raw.replace(/^[\^~]/, ''));
    return coerced?.version ?? null;
  } catch {
    return null;
  }
}

interface AngularJsonProject {
  root?: string;
  sourceRoot?: string;
  projectType?: string;
}

function projectsFromAngularJson(root: string, angularJsonPath: string): WorkspaceProject[] {
  try {
    const parsed = JSON.parse(readFileSync(angularJsonPath, 'utf8')) as {
      projects?: Record<string, AngularJsonProject | string>;
    };
    const projects: WorkspaceProject[] = [];
    for (const [name, value] of Object.entries(parsed.projects ?? {})) {
      const entry = typeof value === 'string' ? { root: value } : value;
      const projectRoot = resolve(root, entry.root ?? '');
      const sourceRoot = entry.sourceRoot
        ? resolve(root, entry.sourceRoot)
        : join(projectRoot, 'src');
      projects.push({ name, root: projectRoot, sourceRoot, projectType: entry.projectType });
    }
    return projects;
  } catch {
    return [];
  }
}

function projectsFromNx(root: string): WorkspaceProject[] {
  try {
    const files = fg.sync('**/project.json', {
      cwd: root,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.angular/**', '**/.nx/**'],
    });
    const projects: WorkspaceProject[] = [];
    for (const file of files) {
      try {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
          name?: string;
          sourceRoot?: string;
          projectType?: string;
        };
        const projectRoot = dirname(file);
        projects.push({
          name: parsed.name ?? basename(projectRoot),
          root: projectRoot,
          sourceRoot: parsed.sourceRoot
            ? resolve(root, parsed.sourceRoot)
            : join(projectRoot, 'src'),
          projectType: parsed.projectType,
        });
      } catch {
        // skip unreadable project files
      }
    }
    return projects;
  } catch {
    return [];
  }
}

function detectSsr(root: string, angularJsonPath: string | null): boolean {
  const pkgPath = join(root, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['@angular/ssr']) {
        return true;
      }
    } catch {
      // keep checking angular.json
    }
  }
  if (angularJsonPath && existsSync(angularJsonPath)) {
    try {
      const raw = readFileSync(angularJsonPath, 'utf8');
      return (
        /"ssr"\s*:/.test(raw) ||
        /"outputMode"\s*:\s*"server"/.test(raw) ||
        /"prerender"\s*:\s*true/.test(raw) ||
        /"server"\s*:\s*"/.test(raw)
      );
    } catch {
      return false;
    }
  }
  return false;
}

export function detectProject(startDir: string): ProjectInfo | null {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const angularJson = join(dir, 'angular.json');
    const nxJson = join(dir, 'nx.json');
    const hasAngular = existsSync(angularJson);
    const hasNx = existsSync(nxJson);

    if (hasAngular || hasNx) {
      const root = resolve(dir);
      let projects = hasAngular ? projectsFromAngularJson(root, angularJson) : [];
      if (hasNx && projects.length === 0) {
        projects = projectsFromNx(root);
      }
      const startAbs = resolve(startDir);
      let focused: WorkspaceProject | undefined;
      if (startAbs !== root) {
        focused = projects
          .filter((p) => startAbs === p.root || startAbs.startsWith(`${p.root}/`))
          .sort((a, b) => b.root.length - a.root.length)[0];
      }
      const angularVersion = readAngularVersion(root);
      return {
        root,
        name: focused?.name ?? projects[0]?.name ?? 'angular-project',
        kind: hasNx ? 'nx' : hasAngular ? 'angular-cli' : 'unknown',
        angularVersion,
        supportTier: supportTierFor(angularVersion),
        workspaceRoots: [root],
        projects,
        hasSsr: detectSsr(root, hasAngular ? angularJson : null),
        focusRoot: focused?.root,
      };
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

export function isAngularMajorAtLeast(version: string | null, major: number): boolean {
  if (!version) {
    return false;
  }
  const parsed = semver.parse(version);
  return parsed !== null && parsed.major >= major;
}
