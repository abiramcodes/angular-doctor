import { basename } from 'node:path';
import fg from 'fast-glob';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { execAll } from '../match.js';
import { openingTags } from './tags.js';

const SECURITY_DOCS = 'https://angular.dev/best-practices/security';

const SECRET_NAME =
  /\b((?:[A-Za-z_$][\w$]*?)?(?:secret|token|password|api[_-]?key)[\w$]*)\s*[:=]\s*(['"`])([^'"`\n]{8,})\2/gi;

const SECRET_PREFIX =
  /(['"`])([^'"`\n]*(?:AKIA[0-9A-Z]{16}|sk_live_[A-Za-z0-9]+|sk_test_[A-Za-z0-9]+|ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY)[^'"`\n]*)\1/g;

export function ruleClientSecret(ctx: RuleContext): Diagnostic[] {
  if (!/\.(?:ts|html|js)$/.test(ctx.file) || ctx.file.endsWith('.spec.ts')) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const seenLines = new Set<number>();
  const report = (index: number) => {
    const pos = lineFromIndex(ctx.content, index);
    if (seenLines.has(pos.line)) {
      return;
    }
    seenLines.add(pos.line);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/client-secret',
          severity: 'error',
          category: 'security',
          message: 'Client code contains a string that looks like a secret.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Read the value from the server environment. Do not ship it in client code.',
          docsUrl: SECURITY_DOCS,
        },
        findings.length,
      ),
    );
  };

  for (const match of execAll(ctx.content, SECRET_NAME)) {
    if (isPlaceholder(match[3] ?? '')) {
      continue;
    }
    report(match.index);
  }
  for (const match of execAll(ctx.content, SECRET_PREFIX)) {
    if (isPlaceholder(match[2] ?? '')) {
      continue;
    }
    report(match.index);
  }
  return findings;
}

export function runEnvFileCheck(ctx: RuleContext): Diagnostic[] {
  const paths = fg.sync(
    ['**/.env', '**/.env.local', '**/.env.development', '**/.env.production', '**/.env.*.local'],
    {
      cwd: ctx.project.root,
      absolute: true,
      dot: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.example', '**/*.sample', '**/*.template'],
    },
  );
  return paths.map((file, index) =>
    diag(
      {
        ruleId: 'angular-doctor/env-file',
        severity: 'error',
        category: 'security',
        message: `${basename(file)} is in the project tree. Keep secrets out of the workspace and confirm the file is gitignored.`,
        file,
        line: 1,
        column: 1,
        docsUrl: SECURITY_DOCS,
      },
      index,
    ),
  );
}

export function ruleInnerHtml(ctx: RuleContext): Diagnostic[] {
  return execAll(ctx.content, /\[innerHTML\]|bind-innerHTML|\.innerHTML\s*=/g).map(
    (match, index) => {
      const pos = lineFromIndex(ctx.content, match.index);
      return diag(
        {
          ruleId: 'angular-doctor/inner-html',
          severity: 'warning',
          category: 'security',
          message: 'innerHTML skips template escaping. Bind text, or review the sanitizer path.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          docsUrl: SECURITY_DOCS,
        },
        index,
      );
    },
  );
}

export function ruleTargetBlank(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  for (const { tag, index } of openingTags(ctx.content)) {
    if (!isBlankTarget(tag) || /noopener|noreferrer/.test(tag)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/target-blank',
          severity: 'warning',
          category: 'security',
          message: 'target="_blank" needs rel="noopener" or rel="noreferrer".',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          docsUrl: SECURITY_DOCS,
        },
        findings.length,
      ),
    );
  }
  return findings;
}

function isBlankTarget(tag: string): boolean {
  return (
    /target\s*=\s*['"]_blank['"]/.test(tag) || /\[target\]\s*=\s*['"]['"]_blank['"]['"]/.test(tag)
  );
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'xxx' ||
    /^x+$/.test(normalized) ||
    normalized.includes('changeme') ||
    normalized.includes('your-api-key') ||
    normalized.includes('todo')
  );
}
