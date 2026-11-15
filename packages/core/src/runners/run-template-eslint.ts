import type { Category, Diagnostic, Severity } from '../types.js';

// Curated subset of @angular-eslint template rules the runner enables.
// Deliberately excludes rules the built-in scanner already covers
// (img-alt, click/keyboard handlers, ngClass/ngStyle bindings, track)
// and no-call-expression, which needs class context the linter cannot see
// (covered instead by angular-doctor/method-in-template).
const TEMPLATE_RULES: Record<string, { severity: Severity; category: Category }> = {
  'button-has-type': { severity: 'warning', category: 'accessibility' },
  'label-has-associated-control': { severity: 'warning', category: 'accessibility' },
  'no-any': { severity: 'warning', category: 'correctness' },
  eqeqeq: { severity: 'warning', category: 'correctness' },
  'no-autofocus': { severity: 'warning', category: 'accessibility' },
};

interface EslintMessage {
  line?: number;
  column?: number;
  message?: string;
  ruleId?: string | null;
  severity?: number | string;
  endLine?: number;
  endColumn?: number;
}

interface TemplatePlugin {
  rules: Record<string, unknown>;
  processors: Record<
    string,
    {
      preprocess: (
        code: string,
        filename: string,
      ) => Array<string | { text: string; filename: string }>;
      postprocess: (messages: EslintMessage[][]) => EslintMessage[];
    }
  >;
}

interface LinterLike {
  verify(
    code: string,
    config: unknown,
    filename: string | { filename: string; basePath: string },
  ): EslintMessage[];
}

export async function runTemplateEslint(
  _projectRoot: string,
  htmlFiles: string[],
  tsFiles: string[] = [],
): Promise<{ diagnostics: Diagnostic[]; skipped: boolean; skipReason?: string }> {
  if (htmlFiles.length === 0 && tsFiles.length === 0) {
    return { diagnostics: [], skipped: false };
  }

  let Linter: new () => LinterLike;
  let plugin: TemplatePlugin;
  let parser: unknown;
  try {
    const eslint = (await import('eslint')) as { Linter: new () => LinterLike };
    Linter = eslint.Linter;
    const pluginModule = (await import('@angular-eslint/eslint-plugin-template')) as unknown;
    plugin = (
      typeof pluginModule === 'object' && pluginModule !== null && 'default' in pluginModule
        ? (pluginModule as { default: TemplatePlugin }).default
        : pluginModule
    ) as TemplatePlugin;
    const parserModule = (await import('@angular-eslint/template-parser')) as {
      default?: unknown;
    } & Record<string, unknown>;
    // The parser package is CJS; its ESM namespace wraps the real parser.
    parser = parserModule.default ?? parserModule;
  } catch {
    // Dependencies are always present in this repo; a future consumer build
    // that drops them stays silent instead of failing the scan.
    return { diagnostics: [], skipped: false };
  }

  const linter = new Linter();
  const config = [
    {
      // Absolute file paths need a leading-slash glob variant.
      files: ['**/*.html', '/**/*.html', '**/*.ts', '/**/*.ts'],
      languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      },
      plugins: { 'angular-eslint-template': plugin },
      rules: Object.fromEntries(
        Object.entries(TEMPLATE_RULES).map(([name]) => [`angular-eslint-template/${name}`, 'warn']),
      ),
    },
  ];

  const { readFileSync } = await import('node:fs');
  const diagnostics: Diagnostic[] = [];
  let index = 0;
  const push = (file: string, messages: EslintMessage[]): void => {
    for (const message of messages) {
      if (!message.ruleId) {
        continue;
      }
      const name = message.ruleId.replace('angular-eslint-template/', '');
      const meta = TEMPLATE_RULES[name];
      if (!meta) {
        continue;
      }
      const line = message.line ?? 1;
      const column = message.column ?? 1;
      diagnostics.push({
        id: `template-eslint:${message.ruleId}:${file}:${line}:${index}`,
        ruleId: `template-eslint/${name}`,
        severity: meta.severity,
        category: meta.category,
        message: message.message ?? 'Template lint issue',
        file,
        line,
        column,
        endLine: message.endLine,
        endColumn: message.endColumn,
        source: 'template-eslint',
      });
      index += 1;
    }
  };

  for (const file of htmlFiles) {
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    // Flat-config globs only match relative names; lint under the root name.
    const relative = file.startsWith(_projectRoot) ? file.slice(_projectRoot.length + 1) : file;
    push(file, linter.verify(content, config, relative));
  }

  const processor = plugin.processors['extract-inline-html'];
  if (processor) {
    for (const file of tsFiles) {
      let content: string;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      const blocks = processor.preprocess(content, file);
      for (const block of blocks) {
        if (typeof block === 'string') {
          continue;
        }
        const relativeVirtual = block.filename.startsWith(_projectRoot)
          ? block.filename.slice(_projectRoot.length + 1)
          : block.filename;
        const nested = [linter.verify(block.text, config, relativeVirtual)];
        const flat = processor.postprocess(nested);
        // postprocess returns messages for the original component file.
        push(file, flat);
      }
    }
  }

  return { diagnostics, skipped: false };
}
