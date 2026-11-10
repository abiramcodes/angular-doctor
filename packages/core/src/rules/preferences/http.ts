import type { Diagnostic } from '../../types.js';
import { type RuleContext } from '../diag-helpers.js';
import { identifierFindings, isComponentOrDirective } from './parse.js';

const HTTP_DOCS = 'https://angular.dev/guide/http';
const RESOURCE_DOCS = 'https://angular.dev/guide/http/http-resource';

export function rulePreferProvideHttpClient(ctx: RuleContext): Diagnostic[] {
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/prefer-provide-http-client',
    pattern: /\bHttpClientModule\b/g,
    message: 'HttpClientModule is the legacy way to provide HttpClient.',
    suggestion: 'Use provideHttpClient() in the application providers.',
    docsUrl: HTTP_DOCS,
  });
}

export function rulePreferFunctionalInterceptor(ctx: RuleContext): Diagnostic[] {
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/prefer-functional-interceptor',
    pattern: /\bHTTP_INTERCEPTORS\b|\bimplements\s+HttpInterceptor\b/g,
    message: 'Class-based HTTP interceptors are the legacy API.',
    suggestion:
      'Register a functional interceptor with provideHttpClient(withInterceptors([...])).',
    docsUrl: HTTP_DOCS,
  });
}

export function rulePreferHttpResource(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !isComponentOrDirective(ctx.content)) {
    return [];
  }
  return identifierFindings(ctx, {
    ruleId: 'angular-doctor/prefer-http-resource',
    pattern: /\b(?:this\.)?http\.get\s*\(/g,
    severity: 'info',
    category: 'performance',
    message: 'Component reads HTTP with HttpClient.get(). Prefer httpResource() for reads.',
    suggestion:
      'Use httpResource() for GET requests. Keep HttpClient for POST, PUT, PATCH, and DELETE.',
    docsUrl: RESOURCE_DOCS,
  });
}
