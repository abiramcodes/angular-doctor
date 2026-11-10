import { readFileSync } from 'node:fs';
import { inferNamingConvention } from '../project/infer-naming-convention.js';
import type { AngularDoctorConfig, Category, Diagnostic, ProjectInfo, Severity } from '../types.js';
import {
  ruleLifecycleHookComplexity,
  ruleLifecycleInterface,
  ruleMemberOrder,
  rulePreferReadonlySignals,
} from './components/component-class-rules.js';
import { rulePreferHostBindings } from './components/host-rules.js';
import { runSharedComponentCheck } from './components/shared-component-rules.js';
import { ruleComponentSubjects } from './components/subscription-rules.js';
import { runDeprecatedAnimationsCheck } from './dependencies/deprecated-animations.js';
import type { RuleContext } from './diag-helpers.js';
import { ruleNgClass, ruleNgStyle } from './modernization/bindings.js';
import {
  ruleLegacyStructuralDirectives,
  ruleMissingForTrack,
} from './modernization/control-flow.js';
import {
  ruleCommonModule,
  ruleNgModuleInModern,
  rulePreferInject,
  ruleStandaloneFalse,
} from './modernization/modules.js';
import {
  ruleBypassSecurity,
  ruleEagerRoute,
  rulePreferServiceDecorator,
  ruleRouterTestingModule,
} from './modernization/platform.js';
import { ruleLegacyInput, ruleLegacyOutput, ruleLegacyQuery } from './modernization/signals.js';
import {
  ruleComponentFileSetMismatch,
  ruleFileHyphenCase,
  ruleFilenameClassMismatch,
  ruleGenericFilename,
  ruleMissingSpecFile,
  ruleNamingConventionMix,
} from './naming/naming-rules.js';
import { definePipeline, executeStep, step, type PipelineStep } from './pipeline.js';
import { ruleEffectWritesState } from './preferences/effects.js';
import {
  ruleFormFieldOwnedAttrs,
  ruleNgModelName,
  rulePreferSignalForms,
} from './preferences/forms.js';
import { ruleDeprecatedIncrementalHydration } from './preferences/hydration.js';
import {
  rulePreferFunctionalInterceptor,
  rulePreferHttpResource,
  rulePreferProvideHttpClient,
} from './preferences/http.js';
import { ruleInputDomName, ruleOutputName } from './preferences/api-names.js';
import { ruleInjectPipe, ruleImpurePipe, rulePipeNameHyphen } from './preferences/pipes.js';
import {
  ruleHostViaElementRef,
  rulePreferDocumentToken,
  rulePreferIsDevMode,
  ruleQueryInLifecycle,
} from './preferences/runtime.js';
import { runTailwindV3Check } from './preferences/tailwind.js';
import { ruleNgContentInControlFlow, ruleTemplateArrowNotCalled } from './preferences/templates.js';
import {
  ruleOneConceptPerFile,
  ruleProjectLayout,
  ruleTypeBasedFolder,
} from './structure/project-structure-rules.js';
import {
  ruleExplicitEagerChangeDetection,
  ruleNgSrcDimensions,
  ruleNgSrcFillDimensions,
  ruleNgSrcPlaceholderSize,
  rulePreferNgOptimizedImage,
} from './templates/performance-rules.js';
import {
  ruleClickWithoutKeyboard,
  ruleControlMissingLabel,
  ruleImgAlt,
  rulePositiveTabindex,
} from './audit/accessibility-rules.js';
import { runDeadCodeCheck } from './audit/dead-code-rules.js';
import { ruleNgDeep, runStrictCheck, runZoneJsCheck } from './audit/framework-rules.js';
import {
  ruleClientSecret,
  ruleInnerHtml,
  ruleTargetBlank,
  runEnvFileCheck,
} from './audit/security-rules.js';
import {
  ruleGenericEventHandler,
  ruleTemplateComplexity,
} from './templates/template-style-rules.js';

export type { RuleContext } from './diag-helpers.js';

const card = (
  id: string,
  title: string,
  defaultSeverity: Diagnostic['severity'],
  category: Diagnostic['category'],
  extra?: { summary?: string; docsUrl?: string; styleGuideUrl?: string; migrationId?: string },
) => ({ id, title, defaultSeverity, category, ...extra });

export const builtinPipeline = definePipeline([
  step({
    kind: 'style-guide',
    reach: 'project',
    rules: [card('angular-doctor/project-layout', 'Project layout', 'info', 'hygiene')],
    run: (ctx) => ruleProjectLayout(ctx),
  }),
  step({
    kind: 'style-guide',
    reach: 'file',
    dedupe: 'message',
    rules: [card('angular-doctor/type-based-folder', 'Type-based folder', 'info', 'hygiene')],
    run: ruleTypeBasedFolder,
  }),
  step({
    kind: 'style-guide',
    reach: 'file',
    rules: [
      card('angular-doctor/file-hyphen-case', 'Hyphenated file names', 'warning', 'hygiene'),
      card('angular-doctor/generic-filename', 'Generic file name', 'info', 'hygiene'),
      card('angular-doctor/missing-spec-file', 'Missing spec file', 'warning', 'hygiene'),
      card(
        'angular-doctor/filename-class-mismatch',
        'Filename class mismatch',
        'warning',
        'hygiene',
      ),
      card(
        'angular-doctor/component-file-set-mismatch',
        'Component file set mismatch',
        'warning',
        'hygiene',
      ),
      card('angular-doctor/naming-convention-mix', 'Mixed naming conventions', 'info', 'hygiene'),
      card(
        'angular-doctor/one-concept-per-file',
        'One concept per file',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/prefer-readonly-signals',
        'Readonly signal APIs',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/lifecycle-interface',
        'Lifecycle interface',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/lifecycle-hook-complexity',
        'Lifecycle hook complexity',
        'info',
        'maintainability',
      ),
      card('angular-doctor/member-order', 'Member order', 'info', 'maintainability'),
      card(
        'angular-doctor/generic-event-handler',
        'Generic event handler name',
        'info',
        'maintainability',
      ),
      card('angular-doctor/template-complexity', 'Template complexity', 'info', 'maintainability'),
    ],
    run: (ctx) => [
      ...ruleFileHyphenCase(ctx),
      ...ruleGenericFilename(ctx),
      ...ruleMissingSpecFile(ctx),
      ...ruleFilenameClassMismatch(ctx),
      ...ruleComponentFileSetMismatch(ctx),
      ...ruleNamingConventionMix(ctx),
      ...ruleOneConceptPerFile(ctx),
      ...rulePreferReadonlySignals(ctx),
      ...ruleLifecycleInterface(ctx),
      ...ruleLifecycleHookComplexity(ctx),
      ...ruleMemberOrder(ctx),
      ...ruleGenericEventHandler(ctx),
      ...ruleTemplateComplexity(ctx),
    ],
  }),
  step({
    kind: 'modernization',
    reach: 'file',
    rules: [
      card(
        'angular-doctor/prefer-control-flow',
        'Built-in control flow',
        'warning',
        'correctness',
        { migrationId: 'control-flow' },
      ),
      card('angular-doctor/missing-for-track', 'Track in @for', 'error', 'performance'),
      card('angular-doctor/prefer-inject', 'inject()', 'warning', 'maintainability', {
        migrationId: 'inject',
      }),
      card('angular-doctor/prefer-standalone', 'Standalone', 'warning', 'correctness', {
        migrationId: 'standalone',
      }),
      card('angular-doctor/standalone-false', 'standalone: false', 'warning', 'correctness', {
        migrationId: 'standalone',
      }),
      card('angular-doctor/prefer-common-imports', 'Explicit imports', 'info', 'maintainability', {
        migrationId: 'common-to-standalone',
      }),
      card('angular-doctor/prefer-class-binding', 'Class bindings', 'info', 'maintainability', {
        migrationId: 'ngclass-to-class',
      }),
      card('angular-doctor/prefer-style-binding', 'Style bindings', 'info', 'maintainability', {
        migrationId: 'ngstyle-to-style',
      }),
      card('angular-doctor/prefer-signal-input', 'Signal inputs', 'info', 'maintainability', {
        migrationId: 'signal-input',
      }),
      card('angular-doctor/prefer-output-fn', 'output()', 'info', 'maintainability', {
        migrationId: 'output',
      }),
      card('angular-doctor/prefer-signal-query', 'Signal queries', 'info', 'maintainability', {
        migrationId: 'signal-queries',
      }),
      card(
        'angular-doctor/prefer-router-module-testing',
        'Router testing',
        'warning',
        'maintainability',
        { migrationId: 'router-testing-module' },
      ),
      card('angular-doctor/prefer-service-decorator', '@Service', 'info', 'maintainability', {
        migrationId: 'service',
      }),
      card('angular-doctor/prefer-lazy-routes', 'Lazy routes', 'info', 'performance', {
        migrationId: 'route-lazy-loading',
      }),
      card('angular-doctor/security-bypass', 'Security bypass', 'error', 'security'),
    ],
    run: (ctx) => [
      ...ruleLegacyStructuralDirectives(ctx),
      ...ruleMissingForTrack(ctx),
      ...rulePreferInject(ctx),
      ...ruleNgModuleInModern(ctx),
      ...ruleStandaloneFalse(ctx),
      ...ruleCommonModule(ctx),
      ...ruleNgClass(ctx),
      ...ruleNgStyle(ctx),
      ...ruleLegacyInput(ctx),
      ...ruleLegacyOutput(ctx),
      ...ruleLegacyQuery(ctx),
      ...ruleRouterTestingModule(ctx),
      ...rulePreferServiceDecorator(ctx),
      ...ruleEagerRoute(ctx),
      ...ruleBypassSecurity(ctx),
    ],
  }),
  step({
    kind: 'performance',
    reach: 'file',
    rules: [
      card('angular-doctor/prefer-ng-optimized-image', 'NgOptimizedImage', 'info', 'performance'),
      card('angular-doctor/ng-src-dimensions', 'ngSrc dimensions', 'warning', 'performance'),
      card('angular-doctor/ng-src-fill-dimensions', 'ngSrc fill', 'warning', 'performance'),
      card('angular-doctor/ng-src-placeholder-size', 'Placeholder size', 'info', 'performance'),
      card(
        'angular-doctor/explicit-eager-change-detection',
        'Eager change detection',
        'info',
        'performance',
      ),
    ],
    run: (ctx) => [
      ...rulePreferNgOptimizedImage(ctx),
      ...ruleNgSrcDimensions(ctx),
      ...ruleNgSrcFillDimensions(ctx),
      ...ruleNgSrcPlaceholderSize(ctx),
      ...ruleExplicitEagerChangeDetection(ctx),
    ],
  }),
  step({
    kind: 'subscription',
    reach: 'file',
    rules: [
      card(
        'angular-doctor/prefer-take-until-destroyed',
        'takeUntilDestroyed',
        'error',
        'correctness',
      ),
      card('angular-doctor/subject-not-cleaned-up', 'Subject cleanup', 'error', 'correctness'),
    ],
    run: ruleComponentSubjects,
  }),
  step({
    kind: 'host',
    reach: 'file',
    rules: [
      card('angular-doctor/prefer-host-bindings', 'Host bindings', 'error', 'maintainability'),
    ],
    run: rulePreferHostBindings,
  }),
  step({
    kind: 'skill-preference',
    reach: 'project',
    rules: [
      card(
        'angular-doctor/deprecated-animations',
        'Deprecated animations package',
        'error',
        'maintainability',
      ),
    ],
    run: (ctx) => runDeprecatedAnimationsCheck(ctx.project.root),
  }),
  step({
    kind: 'skill-preference',
    reach: 'project',
    rules: [
      card('angular-doctor/tailwind-v3-syntax', 'Tailwind v3 syntax', 'warning', 'maintainability'),
    ],
    run: (ctx) => runTailwindV3Check(ctx.project.root),
  }),
  step({
    kind: 'skill-preference',
    reach: 'project',
    rules: [
      card('angular-doctor/complex-component', 'Complex component', 'info', 'maintainability'),
      card('angular-doctor/repeated-template', 'Repeated template', 'info', 'maintainability'),
      card(
        'angular-doctor/repeated-component-logic',
        'Repeated component logic',
        'info',
        'maintainability',
      ),
    ],
    run: runSharedComponentCheck,
  }),
  step({
    kind: 'skill-preference',
    reach: 'file',
    rules: [
      card('angular-doctor/effect-writes-state', 'effect() writes state', 'warning', 'correctness'),
      card('angular-doctor/impure-pipe', 'Impure pipe', 'warning', 'performance'),
      card('angular-doctor/pipe-name-hyphen', 'Pipe name hyphen', 'warning', 'maintainability'),
      card('angular-doctor/inject-pipe', 'Injected pipe', 'warning', 'maintainability'),
      card(
        'angular-doctor/prefer-provide-http-client',
        'provideHttpClient',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/prefer-functional-interceptor',
        'Functional interceptor',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/deprecated-incremental-hydration',
        'Incremental hydration',
        'warning',
        'maintainability',
      ),
      card(
        'angular-doctor/form-field-owned-attrs',
        'formField owned attrs',
        'warning',
        'correctness',
      ),
      card('angular-doctor/ng-model-name', 'ngModel name', 'warning', 'correctness'),
      card(
        'angular-doctor/ng-content-in-control-flow',
        'ng-content in control flow',
        'warning',
        'correctness',
      ),
      card('angular-doctor/template-arrow-not-called', 'Template arrow', 'warning', 'correctness'),
      card('angular-doctor/prefer-signal-forms', 'Signal forms', 'info', 'maintainability'),
      card('angular-doctor/output-name', 'Output name', 'info', 'maintainability'),
      card('angular-doctor/input-dom-name', 'Input DOM name', 'info', 'maintainability'),
      card('angular-doctor/prefer-http-resource', 'httpResource', 'info', 'performance'),
      card('angular-doctor/prefer-document-token', 'DOCUMENT token', 'info', 'correctness'),
      card('angular-doctor/prefer-is-dev-mode', 'isDevMode', 'info', 'maintainability'),
      card('angular-doctor/query-in-lifecycle', 'Query in lifecycle', 'info', 'maintainability'),
      card('angular-doctor/host-via-element-ref', 'Host via ElementRef', 'info', 'maintainability'),
    ],
    run: (ctx) => [
      ...ruleEffectWritesState(ctx),
      ...ruleImpurePipe(ctx),
      ...rulePipeNameHyphen(ctx),
      ...ruleInjectPipe(ctx),
      ...rulePreferProvideHttpClient(ctx),
      ...rulePreferFunctionalInterceptor(ctx),
      ...ruleDeprecatedIncrementalHydration(ctx),
      ...ruleFormFieldOwnedAttrs(ctx),
      ...ruleNgModelName(ctx),
      ...ruleNgContentInControlFlow(ctx),
      ...ruleTemplateArrowNotCalled(ctx),
      ...rulePreferSignalForms(ctx),
      ...ruleOutputName(ctx),
      ...ruleInputDomName(ctx),
      ...rulePreferHttpResource(ctx),
      ...rulePreferDocumentToken(ctx),
      ...rulePreferIsDevMode(ctx),
      ...ruleQueryInLifecycle(ctx),
      ...ruleHostViaElementRef(ctx),
    ],
  }),
  step({
    kind: 'audit',
    reach: 'project',
    rules: [
      card('angular-doctor/env-file', 'Environment file', 'error', 'security', {
        summary: 'A .env file is present in the project tree.',
        docsUrl: 'https://angular.dev/best-practices/security',
      }),
      card('angular-doctor/cleanup-unused-imports-hint', 'Unused import', 'info', 'hygiene', {
        summary: 'A named import is never used in the file.',
        docsUrl: 'https://angular.dev/reference/migrations/cleanup-unused-imports',
        migrationId: 'cleanup-unused-imports',
      }),
      card('angular-doctor/unused-export', 'Unused export', 'warning', 'hygiene', {
        summary: 'An exported class, function, or const is never used.',
      }),
      card('angular-doctor/zone-js', 'zone.js runtime', 'warning', 'performance', {
        summary: 'zone.js is still installed or imported on Angular 20+.',
        docsUrl: 'https://angular.dev/guide/zoneless',
      }),
      card('angular-doctor/typescript-strict', 'TypeScript strict', 'warning', 'correctness', {
        summary: 'compilerOptions.strict is not enabled.',
        docsUrl: 'https://www.typescriptlang.org/tsconfig/strict.html',
      }),
      card('angular-doctor/strict-templates', 'Strict templates', 'warning', 'correctness', {
        summary: 'angularCompilerOptions.strictTemplates is not enabled.',
        docsUrl: 'https://angular.dev/tools/cli/template-typecheck',
      }),
    ],
    run: (ctx) => [
      ...runEnvFileCheck(ctx),
      ...runDeadCodeCheck(ctx),
      ...runZoneJsCheck(ctx),
      ...runStrictCheck(ctx),
    ],
  }),
  step({
    kind: 'audit',
    reach: 'file',
    rules: [
      card('angular-doctor/client-secret', 'Client secret', 'error', 'security', {
        summary: 'A string literal in client code looks like a secret.',
        docsUrl: 'https://angular.dev/best-practices/security',
      }),
      card('angular-doctor/inner-html', 'innerHTML', 'warning', 'security', {
        summary: 'A binding or assignment uses innerHTML.',
        docsUrl: 'https://angular.dev/best-practices/security',
      }),
      card('angular-doctor/target-blank', 'target blank', 'warning', 'security', {
        summary: 'target="_blank" is missing rel="noopener" or rel="noreferrer".',
        docsUrl: 'https://angular.dev/best-practices/security',
      }),
      card('angular-doctor/img-alt', 'Image alt text', 'warning', 'accessibility', {
        summary: 'An img has neither alt nor aria-hidden="true".',
        docsUrl: 'https://angular.dev/guide/accessibility',
      }),
      card(
        'angular-doctor/click-without-keyboard',
        'Click keyboard path',
        'warning',
        'accessibility',
        {
          summary: 'A non-interactive element has click and no keyboard handler.',
          docsUrl: 'https://angular.dev/guide/accessibility',
        },
      ),
      card('angular-doctor/positive-tabindex', 'Positive tabindex', 'warning', 'accessibility', {
        summary: 'tabindex is greater than 0.',
        docsUrl: 'https://angular.dev/guide/accessibility',
      }),
      card('angular-doctor/control-missing-label', 'Control label', 'warning', 'accessibility', {
        summary: 'A form control has no accessible label.',
        docsUrl: 'https://angular.dev/guide/accessibility',
      }),
      card('angular-doctor/ng-deep', 'ng-deep', 'warning', 'maintainability', {
        summary: '::ng-deep, /deep/, or >>> pierces view encapsulation.',
        docsUrl: 'https://angular.dev/guide/components/styling',
      }),
    ],
    run: (ctx) => [
      ...ruleClientSecret(ctx),
      ...ruleInnerHtml(ctx),
      ...ruleTargetBlank(ctx),
      ...ruleImgAlt(ctx),
      ...ruleClickWithoutKeyboard(ctx),
      ...rulePositiveTabindex(ctx),
      ...ruleControlMissingLabel(ctx),
      ...ruleNgDeep(ctx),
    ],
  }),
]);

export interface ListedRule {
  id: string;
  title: string;
  summary?: string;
  defaultSeverity: Severity;
  category: Category;
  docsUrl?: string;
}

export function listRuleCards(category?: Category): ListedRule[] {
  const cards = builtinPipeline.flatMap((item) =>
    item.rules.map((rule) => ({
      id: rule.id,
      title: rule.title,
      summary: rule.summary,
      defaultSeverity: rule.defaultSeverity,
      category: rule.category,
      docsUrl: rule.docsUrl ?? rule.styleGuideUrl,
    })),
  );
  return category ? cards.filter((rule) => rule.category === category) : cards;
}

export function explainRule(id: string): ListedRule {
  const found = listRuleCards().find((rule) => rule.id === id);
  if (!found) {
    throw new Error(`Unknown rule "${id}". Run angular-doctor rules list.`);
  }
  return found;
}

export function runBuiltinRules(
  project: ProjectInfo,
  files: string[],
  config?: AngularDoctorConfig,
  onFile?: (completed: number, file: string, diagnostics: Diagnostic[]) => void,
  onStepError?: (message: string) => void,
): Diagnostic[] {
  const naming = inferNamingConvention(files);
  const diagnostics: Diagnostic[] = [];
  const seenMessages = new Map<PipelineStepKey, Set<string>>();
  const reported = new Set<string>();
  const projectCtx: RuleContext = {
    project,
    file: project.root,
    content: '',
    files,
    config,
    naming,
  };
  const collect = (item: PipelineStep, ctx: RuleContext): void => {
    try {
      diagnostics.push(...executeStep(item, ctx, config, dedupeSet(seenMessages, item)));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const line =
        detail.startsWith('/') || /^[A-Za-z]:[\\/]/.test(detail)
          ? detail
          : `${ctx.file}: ${detail}`;
      if (!onStepError) {
        throw error;
      }
      if (reported.has(line)) {
        return;
      }
      reported.add(line);
      onStepError(line);
    }
  };
  for (const item of builtinPipeline) {
    if (item.reach !== 'project') {
      continue;
    }
    collect(item, projectCtx);
  }
  let completed = 0;
  for (const file of files) {
    completed += 1;
    let content: string;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      onFile?.(completed, file, diagnostics);
      continue;
    }
    const ctx: RuleContext = { project, file, content, config, naming };
    for (const item of builtinPipeline) {
      if (item.reach !== 'file') {
        continue;
      }
      collect(item, ctx);
    }
    onFile?.(completed, file, diagnostics);
  }
  return diagnostics;
}

type PipelineStepKey = (typeof builtinPipeline)[number];

function dedupeSet(seen: Map<PipelineStepKey, Set<string>>, item: PipelineStepKey): Set<string> {
  const existing = seen.get(item);
  if (existing) {
    return existing;
  }
  const created = new Set<string>();
  seen.set(item, created);
  return created;
}
