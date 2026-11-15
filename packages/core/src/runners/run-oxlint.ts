import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import type { Diagnostic } from '../types.js';

const require = createRequire(import.meta.url);

function defaultOxlintConfigPath(): string {
  const configDir = join(tmpdir(), 'angular-doctor');
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
    // The oxlint package exports map blocks the `oxlint/bin/oxlint` subpath,
    // so resolve the package root and join the known bin location.
    const packageJson = require.resolve('oxlint/package.json');
    const bin = join(dirname(packageJson), 'bin', 'oxlint');
    if (existsSync(bin)) {
      return bin;
    }
  } catch {
    // fall through to PATH lookup
  }
  return 'oxlint';
}

interface OxlintSpan {
  line?: number;
  column?: number;
}

interface OxlintJsonMessage {
  filename?: string;
  message?: string;
  code?: string;
  severity?: string | number;
  labels?: Array<{ span?: OxlintSpan }>;
  ruleId?: string;
  line?: number;
  column?: number;
}

export function oxlintRuleId(message: OxlintJsonMessage): string {
  const code = message.code ?? message.ruleId;
  if (!code) {
    return 'oxlint/unknown';
  }
  const named = /^[A-Za-z0-9_-]+\(([^)]+)\)$/.exec(code);
  const rule = named?.[1] ?? code;
  return rule.startsWith('oxlint/') ? rule : `oxlint/${rule}`;
}

function oxlintSeverity(severity: OxlintJsonMessage['severity']): Diagnostic['severity'] {
  if (severity === 'error' || severity === 2) {
    return 'error';
  }
  return 'warning';
}

function oxlintPosition(message: OxlintJsonMessage): { line: number; column: number } {
  const span = message.labels?.[0]?.span;
  return {
    line: span?.line ?? message.line ?? 1,
    column: span?.column ?? message.column ?? 1,
  };
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

  // The resolved bin is a Node script (`#!/usr/bin/env node`); run it through
  // the current Node binary so path/exec-bit differences cannot break it.
  const isScriptPath = oxlint.includes('/') || oxlint.includes('\\');
  const result = spawnSync(
    isScriptPath ? process.execPath : oxlint,
    isScriptPath ? [oxlint, ...args] : args,
    {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    },
  );

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

  const diagnostics: Diagnostic[] = messages.map((m, index) => {
    const ruleId = oxlintRuleId(m);
    const position = oxlintPosition(m);
    return {
      id: `oxlint:${ruleId}:${m.filename ?? ''}:${position.line}:${index}`,
      ruleId,
      severity: oxlintSeverity(m.severity),
      category: 'hygiene',
      message: m.message ?? 'Lint issue',
      file: m.filename ?? '',
      line: position.line,
      column: position.column,
      source: 'oxlint',
    };
  });

  return { diagnostics, skipped: false };
}
