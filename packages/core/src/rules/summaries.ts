/**
 * One-line rule summaries used by `rules list`, `rules explain`, and the
 * generated docs rule pages. Rules with a summary on their registry card
 * keep that text; this map fills the rest.
 */
export const RULE_SUMMARIES: Record<string, string> = {
  'angular-doctor/project-layout': 'Application has no bootstrap entry at its source-root main.ts.',
  'angular-doctor/type-based-folder':
    'Source lives in a components/ or services/ folder instead of a feature folder.',
  'angular-doctor/file-hyphen-case': 'File name is not hyphenated kebab-case.',
  'angular-doctor/generic-filename': 'File is named helpers, utils, or common.',
  'angular-doctor/missing-spec-file':
    'A component, directive, pipe, or service has no sibling .spec.ts file.',
  'angular-doctor/filename-class-mismatch': 'File stem does not match the exported class name.',
  'angular-doctor/component-file-set-mismatch':
    'Component has no template file sharing its base name.',
  'angular-doctor/naming-convention-mix':
    'A folder mixes .component.ts and suffixless component file names.',
  'angular-doctor/one-concept-per-file': 'One file declares several @Component classes.',
  'angular-doctor/prefer-readonly-signals':
    'Signal-based fields should be readonly so the reference cannot be swapped.',
  'angular-doctor/lifecycle-interface':
    'A lifecycle hook is declared without implementing its interface.',
  'angular-doctor/lifecycle-hook-complexity':
    'A lifecycle hook does heavy work instead of delegating.',
  'angular-doctor/member-order': 'Injected fields and inputs should come before methods.',
  'angular-doctor/generic-event-handler':
    'An event handler is named handleX instead of after the action it performs.',
  'angular-doctor/template-complexity':
    'A template expression is complex enough to move into computed().',
  'angular-doctor/prefer-control-flow':
    'Legacy *ngIf, *ngFor, or *ngSwitch instead of built-in @if/@for/@switch.',
  'angular-doctor/missing-for-track': 'An @for block has no track expression.',
  'angular-doctor/prefer-inject':
    'Constructor parameter injection instead of the inject() function.',
  'angular-doctor/prefer-standalone':
    'An NgModule structure that modern Angular handles as standalone.',
  'angular-doctor/standalone-false': 'A declaration sets standalone: false explicitly.',
  'angular-doctor/prefer-common-imports':
    'CommonModule imported instead of only the used directives and pipes.',
  'angular-doctor/prefer-class-binding': '[ngClass] used instead of a class binding.',
  'angular-doctor/prefer-style-binding': '[ngStyle] used instead of a style binding.',
  'angular-doctor/prefer-signal-input': '@Input decorator instead of the signal-based input() API.',
  'angular-doctor/prefer-output-fn': '@Output decorator instead of the output() API.',
  'angular-doctor/prefer-signal-query':
    '@ViewChild/@ContentChild decorators instead of signal queries.',
  'angular-doctor/prefer-router-module-testing': 'Deprecated RouterTestingModule usage.',
  'angular-doctor/prefer-service-decorator':
    '@Injectable({providedIn: "root"}) where the @Service decorator applies.',
  'angular-doctor/prefer-lazy-routes':
    'A route eagerly imports its component instead of lazy loading.',
  'angular-doctor/security-bypass': 'DomSanitizer bypass call such as bypassSecurityTrustHtml.',
  'angular-doctor/prefer-ng-optimized-image':
    'An <img> uses src instead of ngSrc with NgOptimizedImage.',
  'angular-doctor/ng-src-dimensions':
    'An ngSrc image is missing width or height and does not use fill.',
  'angular-doctor/ng-src-fill-dimensions': 'A fill image also sets width or height.',
  'angular-doctor/ng-src-placeholder-size':
    'An ngSrc placeholder data URL decodes to more than 4 KB.',
  'angular-doctor/explicit-eager-change-detection':
    'ChangeDetectionStrategy.Default or Eager is set explicitly.',
  'angular-doctor/prefer-take-until-destroyed':
    'A destroy Subject is torn down in ngOnDestroy instead of takeUntilDestroyed().',
  'angular-doctor/subject-not-cleaned-up': 'A Subject is used and never completed or unsubscribed.',
  'angular-doctor/prefer-host-bindings':
    '@HostBinding or @HostListener instead of the host decorator option.',
  'angular-doctor/deprecated-animations':
    'package.json still lists the legacy @angular/animations package.',
  'angular-doctor/tailwind-v3-syntax': 'Tailwind v3 syntax remains while Tailwind 4 is installed.',
  'angular-doctor/complex-component':
    'A component exceeds template, method, or control-flow size limits.',
  'angular-doctor/repeated-template': 'The same template block appears in another component.',
  'angular-doctor/repeated-component-logic': 'A method body matches a method in another component.',
  'angular-doctor/effect-writes-state': 'effect() writes state with set() or update().',
  'angular-doctor/impure-pipe': 'A pipe declares pure: false and runs on every check.',
  'angular-doctor/pipe-name-hyphen': 'A pipe name contains a hyphen instead of camelCase.',
  'angular-doctor/inject-pipe': 'A pipe class is injected like a service.',
  'angular-doctor/prefer-provide-http-client': 'HttpClientModule instead of provideHttpClient().',
  'angular-doctor/prefer-functional-interceptor':
    'A class-based HTTP interceptor instead of a functional one.',
  'angular-doctor/deprecated-incremental-hydration':
    'withIncrementalHydration() used on Angular 22+.',
  'angular-doctor/form-field-owned-attrs':
    'A [formField] element also binds an attribute the field owns.',
  'angular-doctor/ng-model-name': '[(ngModel)] without a name in a form.',
  'angular-doctor/ng-content-in-control-flow':
    '<ng-content> sits inside control flow or an ng-template.',
  'angular-doctor/template-arrow-not-called':
    'A template event binding is an arrow function that never runs as a call.',
  'angular-doctor/prefer-signal-forms':
    'Reactive or template-driven forms where Signal Forms apply.',
  'angular-doctor/output-name': 'An output is named on… or after a DOM event like click.',
  'angular-doctor/input-dom-name': 'An input shadows a DOM property name like id or title.',
  'angular-doctor/prefer-http-resource':
    'A component reads with HttpClient.get() where httpResource() fits.',
  'angular-doctor/getter-in-template':
    'A template reads a class getter, which re-runs on every change detection cycle.',
  'angular-doctor/defer-missing-trigger':
    '@defer has no on/when/prefetch trigger, so the split buys nothing.',
  'angular-doctor/prefer-document-token':
    'The global document is used instead of injecting DOCUMENT.',
  'angular-doctor/prefer-is-dev-mode': 'environment.production used instead of isDevMode().',
  'angular-doctor/query-in-lifecycle': 'A signal query is read in AfterViewInit/AfterContentInit.',
  'angular-doctor/host-via-element-ref':
    'Host classes, styles, or attributes set through nativeElement.',
};

/** Angular compiler/runtime error codes genuinely related to a rule. */
export const RULE_RELATED_ERRORS: Record<string, string[]> = {
  'angular-doctor/security-bypass': ['NG05201'],
};
