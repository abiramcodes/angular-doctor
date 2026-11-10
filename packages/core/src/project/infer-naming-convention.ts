import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export type NamingMode = 'suffix' | 'suffixless' | 'mixed';

export interface NamingConventionSnapshot {
  mode: NamingMode;
  suffixComponentCount: number;
  plainComponentCount: number;
  dirModes: Map<string, NamingMode>;
  renderingFiles: Set<string>;
}

const COMPONENT_SUFFIX = /\.component\.ts$/;
const NON_RENDERING =
  /(?:^|\/)(?:main|bootstrap|routes|federation\.config|.*\.config|.*\.routes|.*\.spec)\.(?:ts|mts|cts|js|mjs|cjs)$/;

export function isNonRenderingFile(file: string): boolean {
  return NON_RENDERING.test(file);
}

export function inferNamingConvention(filePaths: string[]): NamingConventionSnapshot {
  let suffixComponentCount = 0;
  let plainComponentCount = 0;
  const perDir = new Map<string, { suffix: number; plain: number }>();
  const renderingFiles = collectRenderingFiles(filePaths);

  for (const file of renderingFiles) {
    if (COMPONENT_SUFFIX.test(basename(file))) {
      suffixComponentCount += 1;
      bumpDir(perDir, dirname(file), 'suffix');
    } else {
      plainComponentCount += 1;
      bumpDir(perDir, dirname(file), 'plain');
    }
  }

  const mode: NamingMode =
    suffixComponentCount > 0 && plainComponentCount > 0
      ? 'mixed'
      : suffixComponentCount >= plainComponentCount
        ? 'suffix'
        : 'suffixless';

  const dirModes = new Map<string, NamingMode>();
  for (const [dir, counts] of perDir) {
    if (counts.suffix > 0 && counts.plain > 0) {
      dirModes.set(dir, 'mixed');
    } else if (counts.suffix >= counts.plain) {
      dirModes.set(dir, 'suffix');
    } else {
      dirModes.set(dir, 'suffixless');
    }
  }

  return { mode, suffixComponentCount, plainComponentCount, dirModes, renderingFiles };
}

function collectRenderingFiles(filePaths: string[]): Set<string> {
  const known = new Set(filePaths);
  const rendering = new Set<string>();
  const queue = filePaths.filter(
    (file) => basename(file) === 'app.ts' && file.includes('/src/') && !isNonRenderingFile(file),
  );
  while (queue.length > 0) {
    const file = queue.pop();
    if (!file || rendering.has(file) || isNonRenderingFile(file) || !known.has(file)) {
      continue;
    }
    rendering.add(file);
    let content = '';
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const spec of relativeImports(content)) {
      const resolved = resolveRelativeImport(file, spec, known);
      if (resolved) {
        queue.push(resolved);
      }
    }
  }
  return rendering;
}

function relativeImports(content: string): string[] {
  const specs: string[] = [];
  const fromRe = /from\s+['"](\.[^'"]+)['"]/g;
  const sideEffectRe = /import\s+['"](\.[^'"]+)['"]/g;
  const dynamicRe = /import\(\s*['"](\.[^'"]+)['"]\s*\)/g;
  for (const re of [fromRe, sideEffectRe, dynamicRe]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      if (match[1]) {
        specs.push(match[1]);
      }
    }
  }
  return specs;
}

function resolveRelativeImport(
  fromFile: string,
  spec: string,
  known: Set<string>,
): string | undefined {
  const base = join(dirname(fromFile), spec);
  const stripped = base.replace(/\.(?:js|mjs|cjs)$/, '');
  const candidates = [base, `${stripped}.ts`, join(stripped, 'index.ts')];
  return candidates.find((candidate) => known.has(candidate));
}

function bumpDir(
  map: Map<string, { suffix: number; plain: number }>,
  dir: string,
  kind: 'suffix' | 'plain',
): void {
  const cur = map.get(dir) ?? { suffix: 0, plain: 0 };
  if (kind === 'suffix') {
    cur.suffix += 1;
  } else {
    cur.plain += 1;
  }
  map.set(dir, cur);
}
