import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import semver from 'semver';
import type { ProjectInfo } from '../types.js';

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

export function detectProject(startDir: string): ProjectInfo | null {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const angularJson = join(dir, 'angular.json');
    const nxJson = join(dir, 'nx.json');
    const hasAngular = existsSync(angularJson);
    const hasNx = existsSync(nxJson);

    if (hasAngular || hasNx) {
      let name = 'angular-project';
      if (hasAngular) {
        try {
          const angular = JSON.parse(readFileSync(angularJson, 'utf8')) as {
            projects?: Record<string, unknown>;
          };
          const keys = Object.keys(angular.projects ?? {});
          if (keys.length > 0) {
            name = keys[0]!;
          }
        } catch {
          // keep default name
        }
      }

      return {
        root: dir,
        name,
        kind: hasNx ? 'nx' : hasAngular ? 'angular-cli' : 'unknown',
        angularVersion: readAngularVersion(dir),
        workspaceRoots: [dir],
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
