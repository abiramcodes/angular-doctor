import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';

const TEMPLATE_LINE_LIMIT = 80;
const METHOD_LIMIT = 12;
const CONTROL_FLOW_LIMIT = 8;
const MIN_SHARED_TAGS = 6;
const MIN_SHARED_TEMPLATE_LINES = 15;
const MIN_LOGIC_LINES = 8;

interface ComponentRecord {
  file: string;
  content: string;
  template: string;
  classIndex: number;
}

interface MethodRecord {
  name: string;
  body: string;
  index: number;
  isGetter: boolean;
}

export function runSharedComponentCheck(ctx: RuleContext): Diagnostic[] {
  const files = ctx.files ?? [];
  const records = files.flatMap((file) => loadComponent(file));
  return [...complexComponents(records), ...repeatedTemplates(records), ...repeatedLogic(records)];
}

function loadComponent(file: string): ComponentRecord[] {
  if (!file.endsWith('.ts') || isSkippedFile(file)) {
    return [];
  }
  let content: string;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  if (!/@Component\s*\(/.test(content)) {
    return [];
  }
  const classIndex = content.search(/@Component\s*\(/);
  return [
    {
      file,
      content,
      template: readTemplate(file, content),
      classIndex: classIndex < 0 ? 0 : classIndex,
    },
  ];
}

function isSkippedFile(file: string): boolean {
  const base = basename(file);
  return (
    base.endsWith('.spec.ts') ||
    base === 'main.ts' ||
    base === 'bootstrap.ts' ||
    base === 'routes.ts' ||
    /\.config\.(?:ts|mts|cts|js|mjs|cjs)$/.test(base) ||
    base.endsWith('.routes.ts') ||
    base.startsWith('federation.config.')
  );
}

function readTemplate(file: string, content: string): string {
  const inline = content.match(/template\s*:\s*`([\s\S]*?)`/);
  if (inline?.[1] != null) {
    return inline[1];
  }
  const quoted = content.match(/template\s*:\s*(['"])([\s\S]*?)\1/);
  if (quoted?.[2] != null) {
    return quoted[2];
  }
  const url = content.match(/templateUrl\s*:\s*['"]([^'"]+)['"]/);
  if (!url?.[1]) {
    return '';
  }
  try {
    return readFileSync(join(dirname(file), url[1]), 'utf8');
  } catch {
    return '';
  }
}

function complexComponents(records: ComponentRecord[]): Diagnostic[] {
  return records.flatMap((record) => {
    const templateLines = record.template === '' ? 0 : record.template.split('\n').length;
    const methods = classMethods(record.content).length;
    const controlFlow = (record.template.match(/@(?:if|for|switch)\b/g) ?? []).length;
    if (
      templateLines <= TEMPLATE_LINE_LIMIT &&
      methods <= METHOD_LIMIT &&
      controlFlow <= CONTROL_FLOW_LIMIT
    ) {
      return [];
    }
    const pos = lineFromIndex(record.content, record.classIndex);
    return [
      diag({
        ruleId: 'angular-doctor/complex-component',
        severity: 'info',
        category: 'maintainability',
        message: `Component has ${templateLines} template lines, ${methods} methods, and ${controlFlow} control-flow blocks.`,
        file: record.file,
        line: pos.line,
        column: pos.column,
        suggestion: 'Split the screen or move a repeated block into its own component.',
      }),
    ];
  });
}

function repeatedTemplates(records: ComponentRecord[]): Diagnostic[] {
  const owners = new Map<string, ComponentRecord>();
  const reported = new Set<string>();
  const findings: Diagnostic[] = [];
  for (const record of records) {
    for (const key of templateKeys(record.template)) {
      const first = owners.get(key);
      if (!first) {
        owners.set(key, record);
        continue;
      }
      if (first.file === record.file) {
        continue;
      }
      const pair = `${record.file}|${first.file}`;
      if (reported.has(pair)) {
        continue;
      }
      reported.add(pair);
      const pos = lineFromIndex(record.content, record.classIndex);
      findings.push(
        diag({
          ruleId: 'angular-doctor/repeated-template',
          severity: 'info',
          category: 'maintainability',
          message: `Repeated template block also appears in ${first.file}.`,
          file: record.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Extract the shared block into its own component.',
        }),
      );
    }
  }
  return findings;
}

function repeatedLogic(records: ComponentRecord[]): Diagnostic[] {
  const owners = new Map<string, { file: string; name: string }>();
  const findings: Diagnostic[] = [];
  for (const record of records) {
    for (const method of classMethods(record.content)) {
      if (method.isGetter && isFieldReturn(method.body)) {
        continue;
      }
      const lines = significantLines(method.body);
      if (lines.length < MIN_LOGIC_LINES) {
        continue;
      }
      const key = normalizeLogic(lines.join('\n'));
      const first = owners.get(key);
      if (!first) {
        owners.set(key, { file: record.file, name: method.name });
        continue;
      }
      if (first.file === record.file) {
        continue;
      }
      const pos = lineFromIndex(record.content, method.index);
      findings.push(
        diag({
          ruleId: 'angular-doctor/repeated-component-logic',
          severity: 'info',
          category: 'maintainability',
          message: `Method ${method.name} matches ${first.name} in ${first.file}.`,
          file: record.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Move the shared method into a component or service both screens can use.',
        }),
      );
    }
  }
  return findings;
}

function templateKeys(template: string): string[] {
  const normalizedLines = template
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const keys: string[] = [];
  if (normalizedLines.length >= MIN_SHARED_TEMPLATE_LINES) {
    for (let i = 0; i <= normalizedLines.length - MIN_SHARED_TEMPLATE_LINES; i += 1) {
      keys.push(
        normalizeTemplate(normalizedLines.slice(i, i + MIN_SHARED_TEMPLATE_LINES).join('\n')),
      );
    }
  }
  const tags = tagTokens(template);
  if (tags.length >= MIN_SHARED_TAGS) {
    for (let i = 0; i <= tags.length - MIN_SHARED_TAGS; i += 1) {
      keys.push(tags.slice(i, i + MIN_SHARED_TAGS).join('>'));
    }
  }
  return keys;
}

function tagTokens(template: string): string[] {
  const tokens: string[] = [];
  const re = /@(if|for|switch)\b|\*(ngIf|ngFor|ngSwitch)\b|<\/?([A-Za-z][\w:-]*)\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    if (match[0].startsWith('</')) {
      continue;
    }
    const name = (match[1] ?? match[2] ?? match[3] ?? '').toLowerCase();
    if (name) {
      tokens.push(name);
    }
  }
  return tokens;
}

function normalizeTemplate(value: string): string {
  return value
    .replace(/\{\{[\s\S]*?\}\}/g, '#')
    .replace(/=\s*"[^"]*"/g, '="#"')
    .replace(/=\s*'[^']*'/g, "='#'")
    .replace(/>([^<]+)</g, (chunk, text: string) => (text.trim() === '' ? '><' : '>#' + '<'))
    .replace(/\s+/g, ' ')
    .trim();
}

function classMethods(content: string): MethodRecord[] {
  const methods: MethodRecord[] = [];
  const re =
    /(?:^|\n)[ \t]*(?:(get|set)\s+)?(?:(?:public|private|protected|readonly|async|override|static)\s+)*([A-Za-z_]\w*)\s*\([^)]*\)\s*(?::\s*[^{\n]+)?\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const name = match[2];
    if (!name || ['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
      continue;
    }
    const brace = content.indexOf('{', match.index);
    const body = braced(content, brace);
    if (body == null) {
      continue;
    }
    methods.push({
      name,
      body,
      index: match.index,
      isGetter: match[1] === 'get',
    });
  }
  return methods;
}

function significantLines(body: string): string[] {
  return body
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalizeLogic(body: string): string {
  return body
    .replace(/'(?:\\'|[^'])*'/g, '#')
    .replace(/"(?:\\"|[^"])*"/g, '#')
    .replace(/`(?:\\`|[^`])*`/g, '#')
    .replace(/\b\d+(?:\.\d+)?\b/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFieldReturn(body: string): boolean {
  return /^return (?:this\.)?[A-Za-z_]\w*;?$/.test(
    normalizeLogic(significantLines(body).join(' ')),
  );
}

function braced(content: string, open: number): string | null {
  let depth = 0;
  for (let i = open; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(open + 1, i);
      }
    }
  }
  return null;
}
