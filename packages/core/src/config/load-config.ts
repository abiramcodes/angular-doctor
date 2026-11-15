import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AngularDoctorConfig } from '../types.js';

const CONFIG_NAME = 'angular-doctor.config.json';
const UNSUPPORTED_CONFIG_NAME = 'angular-doctor.config.ts';

function mergeConfig(base: AngularDoctorConfig, next: AngularDoctorConfig): AngularDoctorConfig {
  return {
    ...base,
    ...next,
    rules: { ...base.rules, ...next.rules },
    ignore: next.ignore ?? base.ignore,
  };
}

export function loadConfig(projectRoot: string): AngularDoctorConfig {
  let merged: AngularDoctorConfig = {};

  const jsonPath = join(projectRoot, CONFIG_NAME);
  if (existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as AngularDoctorConfig;
      merged = mergeConfig(merged, raw);
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
        merged = mergeConfig(merged, pkg.angularDoctor);
      }
    } catch {
      // ignore
    }
  }

  return merged;
}

export function findUnsupportedConfig(projectRoot: string): string | null {
  return existsSync(join(projectRoot, UNSUPPORTED_CONFIG_NAME)) ? UNSUPPORTED_CONFIG_NAME : null;
}

export function resolveReportPath(projectRoot: string, config: AngularDoctorConfig): string {
  if (config.reportPath) {
    return join(projectRoot, config.reportPath);
  }
  const dir = config.reportDirectory ?? '.';
  return join(projectRoot, dir, 'angular-doctor-report.md');
}

export function resolveHtmlReportPath(projectRoot: string, config: AngularDoctorConfig): string {
  if (config.reportPath) {
    return join(projectRoot, config.reportPath.replace(/\.md$/i, '.html'));
  }
  const dir = config.reportDirectory ?? '.';
  return join(projectRoot, dir, 'angular-doctor-report.html');
}
