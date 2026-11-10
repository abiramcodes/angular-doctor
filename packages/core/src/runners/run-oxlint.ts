import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { Diagnostic } from '../types.js';

const require = createRequire(import.meta.url);

function defaultOxlintConfigPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const configDir = join(here, '..', 'config', 'assets');
  mkdirSync(configDir, { recursive: true });
  const configPath = join(configDir, 'oxlintrc.json');
  if (!existsSync(configPath)) {
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          $schema: './node_modules/oxlint/configuration_schema.json',
          env: { browser: true, es2022: true, node: true },
          rules: {
            'typescript/no-explicit-any': 'warn',
            'typescript/no-unused-vars': 'warn',
            eqeqeq: 'warn',
          },
        },
        null,
        2,
      ),
    );
  }
  return configPath;
}

function resolveOxlintBinary(): string {
  try {
    return require.resolve('oxlint/bin/oxlint');
  } catch {
    return 'oxlint';
  }
}

interface OxlintJsonMessage {
  filename?: string;
  message?: string;
  line?: number;
  column?: number;
  ruleId?: string;
  severity?: number;
}

export function runOxlint(
  projectRoot: string,
  files: string[],
): { diagnostics: Diagnostic[]; skipped: boolean; skipReason?: string } {
  if (files.length === 0) {
    return { diagnostics: [], skipped: false };
  }

  const oxlint = resolveOxlintBinary();
  const configPath = defaultOxlintConfigPath();
  const args = ['--format', 'json', '-c', configPath, ...files];

  const result = spawnSync(oxlint, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.error) {
    return {
      diagnostics: [],
      skipped: true,
      skipReason: `Oxlint unavailable: ${result.error.message}`,
    };
  }

  const stdout = result.stdout?.trim() ?? '';
  if (!stdout) {
    return { diagnostics: [], skipped: false };
  }

  let messages: OxlintJsonMessage[] = [];
  try {
    const parsed = JSON.parse(stdout) as
      | OxlintJsonMessage[]
      | { diagnostics?: OxlintJsonMessage[] };
    messages = Array.isArray(parsed) ? parsed : (parsed.diagnostics ?? []);
  } catch {
    return {
      diagnostics: [],
      skipped: true,
      skipReason: 'Oxlint produced non-JSON output.',
    };
  }

  const diagnostics: Diagnostic[] = messages.map((m, index) => ({
    id: `oxlint:${m.ruleId ?? 'unknown'}:${m.filename ?? ''}:${m.line ?? 0}:${index}`,
    ruleId: m.ruleId ?? 'oxlint/unknown',
    severity: m.severity === 2 ? 'error' : 'warning',
    category: 'hygiene',
    message: m.message ?? 'Lint issue',
    file: m.filename ?? '',
    line: m.line ?? 1,
    column: m.column ?? 1,
    source: 'oxlint',
  }));

  return { diagnostics, skipped: false };
}
