import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import fg from 'fast-glob';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp, execAll } from '../match.js';

const MIGRATION_DOCS = 'https://angular.dev/reference/migrations/cleanup-unused-imports';

export function runDeadCodeCheck(ctx: RuleContext): Diagnostic[] {
  const files = ctx.files ?? [];
  if (files.length === 0) {
    return [];
  }
  const specs = fg.sync('**/*.spec.ts', {
    cwd: ctx.project.root,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/.angular/**'],
  });
  const contents = new Map<string, string>();
  for (const file of [...files, ...specs]) {
    if (contents.has(file)) {
      continue;
    }
    try {
      contents.set(file, readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
  }

  const importedByOthers = new Map<string, Set<string>>();
  for (const [file, content] of contents) {
    try {
      importedByOthers.set(file, importedExportNames(content));
    } catch (error) {
      throw fileFailure(file, error);
    }
  }

  const findings: Diagnostic[] = [];
  for (const file of files) {
    const content = contents.get(file);
    if (!content) {
      continue;
    }
    try {
      findings.push(...unusedImports(file, content, findings.length));
      if (!isEntryFile(file)) {
        findings.push(...unusedExports(file, content, importedByOthers, findings.length));
      }
    } catch (error) {
      throw fileFailure(file, error);
    }
  }
  return findings;
}

function fileFailure(file: string, error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(detail.startsWith(`${file}:`) ? detail : `${file}: ${detail}`);
}

function unusedImports(file: string, content: string, start: number): Diagnostic[] {
  const body = content
    .replace(/import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\s*;?/g, '')
    .replace(/import\s+['"][^'"]+['"]\s*;?/g, '');
  const findings: Diagnostic[] = [];
  for (const match of execAll(content, /import\s+([\s\S]*?)\sfrom\s+['"][^'"]+['"]/g)) {
    for (const binding of splitBindings(match[1] ?? '')) {
      if (!binding.local || countIdent(body, binding.local) > 0) {
        continue;
      }
      const pos = lineFromIndex(content, match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/cleanup-unused-imports-hint',
            migrationId: 'cleanup-unused-imports',
            severity: 'info',
            category: 'hygiene',
            message: `Import ${binding.local} is never used.`,
            file,
            line: pos.line,
            column: pos.column,
            suggestion: 'Run the cleanup-unused-imports migration.',
            docsUrl: MIGRATION_DOCS,
          },
          start + findings.length,
        ),
      );
    }
  }
  return findings;
}

function unusedExports(
  file: string,
  content: string,
  importedByOthers: Map<string, Set<string>>,
  start: number,
): Diagnostic[] {
  const findings: Diagnostic[] = [];
  const pattern =
    /export\s+(?:abstract\s+)?(?:async\s+)?(?:class|function|const)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of execAll(content, pattern)) {
    const name = match[1] ?? '';
    if (
      !name ||
      countIdent(content, name) > 1 ||
      isImportedElsewhere(file, name, importedByOthers)
    ) {
      continue;
    }
    const pos = lineFromIndex(content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/unused-export',
          severity: 'warning',
          category: 'hygiene',
          message: `Export ${name} is never used.`,
          file,
          line: pos.line,
          column: pos.column,
        },
        start + findings.length,
      ),
    );
  }
  return findings;
}

function isImportedElsewhere(
  file: string,
  name: string,
  importedByOthers: Map<string, Set<string>>,
): boolean {
  for (const [other, names] of importedByOthers) {
    if (other !== file && names.has(name)) {
      return true;
    }
  }
  return false;
}

function importedExportNames(content: string): Set<string> {
  const names = new Set<string>();
  for (const match of execAll(content, /import\s+([\s\S]*?)\sfrom\s+['"][^'"]+['"]/g)) {
    for (const binding of splitBindings(match[1] ?? '')) {
      if (binding.exported) {
        names.add(binding.exported);
      }
    }
  }
  return names;
}

function splitBindings(clause: string): { local: string; exported: string }[] {
  const bindings: { local: string; exported: string }[] = [];
  const rest = clause.trim().replace(/^type\s+/, '');
  if (!rest) {
    return bindings;
  }
  const braceAt = rest.indexOf('{');
  const head = (braceAt === -1 ? rest : rest.slice(0, braceAt)).replace(/,\s*$/, '').trim();
  if (head.startsWith('* as ')) {
    const local = identifier(head.slice('* as '.length));
    if (local) {
      bindings.push({ local, exported: '' });
    }
  } else if (head && !head.startsWith('{')) {
    const local = identifier(head);
    if (local) {
      bindings.push({ local, exported: '' });
    }
  }
  if (braceAt === -1) {
    return bindings;
  }
  const inner = rest.slice(braceAt + 1, rest.lastIndexOf('}'));
  for (const part of inner.split(',')) {
    const bit = part.trim().replace(/^type\s+/, '');
    if (!bit) {
      continue;
    }
    const [exported, alias] = bit.split(/\s+as\s+/);
    const local = identifier(alias ?? exported);
    const exportedName = identifier(exported);
    if (local) {
      bindings.push({ local, exported: exportedName });
    }
  }
  return bindings;
}

const IDENTIFIER = /^[$A-Za-z_][\w$]*$/;

function identifier(value: string | undefined): string {
  const name = value?.trim() ?? '';
  return IDENTIFIER.test(name) ? name : '';
}

function countIdent(content: string, name: string): number {
  return execAll(content, new RegExp(`\\b${escapeRegExp(name)}\\b`, 'g')).length;
}

function isEntryFile(file: string): boolean {
  const base = basename(file);
  return (
    base === 'main.ts' ||
    base === 'bootstrap.ts' ||
    base === 'app.ts' ||
    base.endsWith('.routes.ts') ||
    base.endsWith('.config.ts') ||
    base.startsWith('federation.config.')
  );
}
