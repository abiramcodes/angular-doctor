import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AngularDoctorConfig } from '../types.js';

const CONFIG_NAMES = ['angular-doctor.config.json', 'angular-doctor.config.ts'] as const;

export function loadConfig(projectRoot: string): AngularDoctorConfig {
  const merged: AngularDoctorConfig = {};

  for (const name of CONFIG_NAMES) {
    const path = join(projectRoot, name);
    if (!existsSync(path) || name.endsWith('.ts')) {
      continue;
    }
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as AngularDoctorConfig;
      Object.assign(merged, raw);
    } catch {
      // ignore malformed config
    }
  }

  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        angularDoctor?: AngularDoctorConfig;
      };
      if (pkg.angularDoctor) {
        Object.assign(merged, pkg.angularDoctor);
      }
    } catch {
      // ignore
    }
  }

  return merged;
}

export function resolveReportPath(projectRoot: string, config: AngularDoctorConfig): string {
  if (config.reportPath) {
    return join(projectRoot, config.reportPath);
  }
  const dir = config.reportDirectory ?? '.';
  return join(projectRoot, dir, 'angular-doctor-report.md');
}
