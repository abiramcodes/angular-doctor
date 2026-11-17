import type { Diagnostic } from '../../types.js';
import { diag, lineFromIndex, majorVersion, type RuleContext } from '../diag-helpers.js';
import { maskCommentsAndStrings } from '../preferences/parse.js';

export function ruleRouterTestingModule(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.spec.ts')) {
    return [];
  }
  const source = maskCommentsAndStrings(ctx.content);
  if (!/RouterTestingModule/.test(source)) {
    return [];
  }
  const index = source.indexOf('RouterTestingModule');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-router-module-testing',
      migrationId: 'router-testing-module',
      severity: 'warning',
      category: 'maintainability',
      message: 'RouterTestingModule usage in tests is deprecated.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion: 'Run router-testing-module-migration.',
    }),
  ];
}

export function rulePreferServiceDecorator(ctx: RuleContext): Diagnostic[] {
  if (majorVersion(ctx.project) < 22 || !ctx.file.endsWith('.ts')) {
    return [];
  }
  // @Service only replaces root-provided singletons. Module-scoped,
  // element-scoped, and multi providers must keep @Injectable.
  const rootMatch = /@Injectable\s*\(\s*\{[^}]*providedIn\s*:\s*['"]root['"]/.exec(ctx.content);
  if (!rootMatch || maskCommentsAndStrings(ctx.content)[rootMatch.index] !== '@') {
    return [];
  }
  const index = ctx.content.indexOf('@Injectable');
  const pos = lineFromIndex(ctx.content, index);
  return [
    diag({
      ruleId: 'angular-doctor/prefer-service-decorator',
      migrationId: 'service',
      severity: 'info',
      category: 'maintainability',
      message: '@Injectable found. Angular 22+ supports @Service for singletons.',
      file: ctx.file,
      line: pos.line,
      column: pos.column,
      suggestion:
        'Run service migration where @Service applies; keep @Injectable for multi providers.',
    }),
  ];
}

export function ruleEagerRoute(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !/(Routes|routes|provideRouter)/.test(ctx.content)) {
    return [];
  }
  if (majorVersion(ctx.project) < 19) {
    return [];
  }
  const re = /\bcomponent\s*:\s*[A-Z]\w+/g;
  let match: RegExpExecArray | null;
  const findings: Diagnostic[] = [];
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const before = ctx.content.slice(Math.max(0, match.index - 200), match.index);
    if (/\bloadComponent\s*:/.test(before) || /\bloadChildren\s*:/.test(before)) {
      continue;
    }
    // The empty-path shell component renders on every navigation, so
    // eager loading is the right choice for it.
    if (/\bpath\s*:\s*['"]['"]/.test(before)) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-lazy-routes',
          migrationId: 'route-lazy-loading',
          severity: 'info',
          category: 'performance',
          message: 'Eager route component reference found. Consider lazy loading.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Run route-lazy-loading-migration for loadComponent patterns.',
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleBypassSecurity(ctx: RuleContext): Diagnostic[] {
  const findings: Diagnostic[] = [];
  const masked = maskCommentsAndStrings(ctx.content);
  const patterns = [
    /bypassSecurityTrustHtml/g,
    /bypassSecurityTrustStyle/g,
    /bypassSecurityTrustScript/g,
    /bypassSecurityTrustUrl/g,
    /bypassSecurityTrustResourceUrl/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    let i = 0;
    const re = new RegExp(pattern.source, 'g');
    while ((match = re.exec(ctx.content)) !== null) {
      if (masked[match.index] !== 'b') {
        continue;
      }
      const pos = lineFromIndex(ctx.content, match.index);
      findings.push(
        diag(
          {
            ruleId: 'angular-doctor/security-bypass',
            severity: 'warning',
            category: 'security',
            message: 'DomSanitizer bypass API usage requires strict review.',
            file: ctx.file,
            line: pos.line,
            column: pos.column,
            suggestion:
              'Avoid bypassing sanitization. Prefer binding safe values or server-side sanitization.',
            docsUrl: 'https://angular.dev/best-practices/security',
          },
          i++,
        ),
      );
    }
  }
  return findings;
}
