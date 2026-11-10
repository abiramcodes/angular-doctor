import type { Diagnostic } from '../types.js';

export async function runTemplateEslint(
  _projectRoot: string,
  htmlFiles: string[],
): Promise<{ diagnostics: Diagnostic[]; skipped: boolean; skipReason?: string }> {
  if (htmlFiles.length === 0) {
    return { diagnostics: [], skipped: false };
  }

  try {
    await import('eslint');
    await import('@angular-eslint/eslint-plugin-template');
    await import('@angular-eslint/template-parser');
  } catch {
    return {
      diagnostics: [],
      skipped: true,
      skipReason:
        'Template ESLint is optional for v0.1. Install eslint and @angular-eslint/* to enable HTML template rules.',
    };
  }

  return {
    diagnostics: [],
    skipped: true,
    skipReason:
      'Template ESLint runner stub: hybrid pipeline is wired; enable @angular-eslint in a follow-up PR.',
  };
}
