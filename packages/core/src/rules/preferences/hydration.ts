import type { Diagnostic } from '../../types.js';
import { majorVersion, type RuleContext } from '../diag-helpers.js';
import { identifierFindings } from './parse.js';

const HYDRATION_DOCS = 'https://angular.dev/guide/hydration';

export function ruleDeprecatedIncrementalHydration(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || majorVersion(ctx.project) < 22) {
    return [];
  }
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/deprecated-incremental-hydration',
    pattern: /\bwithIncrementalHydration\s*\(/g,
    message:
      'withIncrementalHydration() is deprecated. Incremental hydration is already the default.',
    suggestion:
      'Remove withIncrementalHydration(). Use withNoIncrementalHydration() only to opt out.',
    docsUrl: HYDRATION_DOCS,
  });
}
