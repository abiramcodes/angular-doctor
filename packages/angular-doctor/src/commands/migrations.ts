import { getRecommendedMigrations, MIGRATIONS_HUB } from '@angular-doctor/core/migrations/registry';
import { runScan } from '@angular-doctor/core/scan/run-scan';
import pc from 'picocolors';
import { colorize } from './palette.js';

export interface MigrationsCommandOptions {
  cwd: string;
  scope: string;
  files?: string[];
}

const SCOPES = ['full', 'changed', 'files', 'contextual'] as const;

function parseScope(raw: string): (typeof SCOPES)[number] {
  if ((SCOPES as readonly string[]).includes(raw)) {
    return raw as (typeof SCOPES)[number];
  }
  throw new Error(`Invalid --scope "${raw}". Use full, changed, files, or contextual.`);
}

export async function runMigrationsCommand(options: MigrationsCommandOptions): Promise<void> {
  const scope = parseScope(options.scope);
  const result = await runScan({
    cwd: options.cwd,
    scope,
    files: options.files,
  });

  const recommended = getRecommendedMigrations(
    result.diagnostics,
    result.project.root,
    result.project.angularVersion,
  );

  console.log(pc.bold('Angular Doctor migration plan (no commands executed)'));
  console.log(`Hub: ${MIGRATIONS_HUB}`);
  console.log('');

  if (recommended.length === 0) {
    console.log('No schematic-backed migrations matched this scan.');
    return;
  }

  for (const m of recommended) {
    console.log(colorize(m.title, 'info'));
    console.log(`  Docs: ${m.docsUrl}`);
    console.log(`  Dry run: ${m.command} --dry-run`);
    console.log(`  Apply:   ${m.command}`);
    console.log('');
  }
}
