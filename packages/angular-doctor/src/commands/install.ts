import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pc from 'picocolors';
import { colorize } from './palette.js';

const SKILL_TARGETS = [
  { agent: 'cursor', dir: '.cursor/skills/angular-doctor' },
  { agent: 'agents', dir: '.agents/skills/angular-doctor' },
] as const;

function skillSourcePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'skills', 'angular-doctor', 'SKILL.md');
}

export async function runInstall(options: { cwd: string; force?: boolean }): Promise<void> {
  const source = skillSourcePath();
  if (!existsSync(source)) {
    throw new Error(`Bundled skill missing at ${source}`);
  }

  for (const target of SKILL_TARGETS) {
    const destDir = join(options.cwd, target.dir);
    const destFile = join(destDir, 'SKILL.md');
    if (existsSync(destFile) && !options.force) {
      console.log(pc.dim(`Skip ${target.agent}: skill already installed`));
      continue;
    }
    mkdirSync(destDir, { recursive: true });
    copyFileSync(source, destFile);
    console.log(colorize(`Installed skill for ${target.agent} → ${destFile}`, 'success'));
  }
}

export async function runCiInstall(options: { cwd: string }): Promise<void> {
  const workflowDir = join(options.cwd, '.github', 'workflows');
  const workflowPath = join(workflowDir, 'angular-doctor.yml');
  if (existsSync(workflowPath)) {
    console.log(pc.dim('CI workflow already exists, skipping.'));
    return;
  }
  mkdirSync(workflowDir, { recursive: true });
  const workflow = `name: Angular Doctor

on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: npx angular-doctor@latest --json
`;
  await import('node:fs').then(({ writeFileSync }) =>
    writeFileSync(workflowPath, workflow, 'utf8'),
  );
  console.log(colorize(`Wrote ${workflowPath}`, 'success'));
}
