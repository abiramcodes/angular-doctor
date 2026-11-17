import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ruleDeprecatedIncrementalHydration } from '../src/rules/preferences/hydration.js';
import { ruleEffectWritesState } from '../src/rules/preferences/effects.js';
import {
  ruleFormFieldOwnedAttrs,
  ruleNgModelName,
  rulePreferSignalForms,
} from '../src/rules/preferences/forms.js';
import {
  ruleHostViaElementRef,
  rulePreferDocumentToken,
  rulePreferIsDevMode,
  ruleQueryInLifecycle,
} from '../src/rules/preferences/runtime.js';
import {
  ruleImpurePipe,
  ruleInjectPipe,
  rulePipeNameHyphen,
} from '../src/rules/preferences/pipes.js';
import { ruleInputDomName, ruleOutputName } from '../src/rules/preferences/api-names.js';
import { ruleNgContentInControlFlow } from '../src/rules/preferences/templates.js';
import {
  rulePreferFunctionalInterceptor,
  rulePreferHttpResource,
  rulePreferProvideHttpClient,
} from '../src/rules/preferences/http.js';
import {
  runTailwindV3Check,
  tailwindMajorFromPackageJson,
  tailwindV3InStylesheet,
} from '../src/rules/preferences/tailwind.js';
import type { RuleContext } from '../src/rules/diag-helpers.js';
import type { Diagnostic, ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

const angular21: ProjectInfo = { ...project, angularVersion: '21.2.0' };

function scan(
  rule: (ctx: RuleContext) => Diagnostic[],
  content: string,
  file = '/tmp/src/app/example.ts',
  info: ProjectInfo = project,
): Diagnostic[] {
  return rule({ project: info, file, content });
}

describe('skill preference rules', () => {
  it('flags an effect that writes a same-file signal and ignores a read-only effect', () => {
    const found = scan(
      ruleEffectWritesState,
      'readonly count = signal(0); effect(() => { this.count.set(1); }); effect(() => this.count());',
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      ruleId: 'angular-doctor/effect-writes-state',
      severity: 'warning',
    });
  });

  it('flags impure and hyphenated pipes', () => {
    const source = "@Pipe({ name: 'legacy-date', pure: false })";
    expect(scan(ruleImpurePipe, source)[0]?.ruleId).toBe('angular-doctor/impure-pipe');
    expect(scan(ruleImpurePipe, source)[0]?.severity).toBe('error');
    expect(scan(rulePipeNameHyphen, source)[0]?.ruleId).toBe('angular-doctor/pipe-name-hyphen');
    expect(scan(ruleImpurePipe, "@Pipe({ name: 'legacyDate' })")).toHaveLength(0);
    expect(scan(rulePipeNameHyphen, "@Pipe({ name: 'legacyDate' })")).toHaveLength(0);
  });

  it('flags injected pipe classes', () => {
    expect(scan(ruleInjectPipe, 'date = inject(DatePipe);')[0]?.ruleId).toBe(
      'angular-doctor/inject-pipe',
    );
    expect(scan(ruleInjectPipe, 'constructor(private readonly date: DatePipe) {}')).toHaveLength(1);
    expect(scan(ruleInjectPipe, 'http = inject(HttpClient);')).toHaveLength(0);
  });

  it('flags legacy HTTP setup', () => {
    expect(scan(rulePreferProvideHttpClient, 'imports: [HttpClientModule]')[0]).toMatchObject({
      ruleId: 'angular-doctor/prefer-provide-http-client',
      severity: 'warning',
    });
    expect(
      scan(rulePreferFunctionalInterceptor, 'class Auth implements HttpInterceptor {}')[0]?.ruleId,
    ).toBe('angular-doctor/prefer-functional-interceptor');
    expect(scan(rulePreferFunctionalInterceptor, 'provide: HTTP_INTERCEPTORS')).toHaveLength(1);
  });

  it('flags withIncrementalHydration only on Angular 22+', () => {
    const source = 'provideClientHydration(withIncrementalHydration())';
    expect(scan(ruleDeprecatedIncrementalHydration, source)[0]?.ruleId).toBe(
      'angular-doctor/deprecated-incremental-hydration',
    );
    expect(scan(ruleDeprecatedIncrementalHydration, source, '/tmp/a.ts', angular21)).toHaveLength(
      0,
    );
  });

  it('flags formField attributes and nameless ngModel', () => {
    expect(
      scan(
        ruleFormFieldOwnedAttrs,
        '<input [formField]="email" [disabled]="locked" />',
        '/tmp/a.html',
      )[0]?.ruleId,
    ).toBe('angular-doctor/form-field-owned-attrs');
    expect(
      scan(ruleFormFieldOwnedAttrs, '<input [formField]="email" />', '/tmp/a.html'),
    ).toHaveLength(0);
    expect(
      scan(ruleNgModelName, '<form><input [(ngModel)]="name" /></form>', '/tmp/a.html')[0]?.ruleId,
    ).toBe('angular-doctor/ng-model-name');
    expect(
      scan(ruleNgModelName, '<form><input name="user" [(ngModel)]="name" /></form>', '/tmp/a.html'),
    ).toHaveLength(0);
    expect(scan(ruleNgModelName, '<input [(ngModel)]="name" />', '/tmp/a.html')).toHaveLength(0);
  });

  it('flags projected content inside control flow', () => {
    expect(
      scan(ruleNgContentInControlFlow, '@if (show) { <ng-content /> }', '/tmp/a.html'),
    ).toHaveLength(1);
    expect(
      scan(ruleNgContentInControlFlow, '@if (show) { <ng-content /> }', '/tmp/a.html')[0]?.ruleId,
    ).toBe('angular-doctor/ng-content-in-control-flow');
    expect(scan(ruleNgContentInControlFlow, '<ng-content />', '/tmp/a.html')).toHaveLength(0);
  });

  it('reports info preferences without promoting them to warnings', () => {
    expect(
      scan(rulePreferSignalForms, "import { FormGroup, FormBuilder } from '@angular/forms';")[0],
    ).toMatchObject({ ruleId: 'angular-doctor/prefer-signal-forms', severity: 'info' });
    expect(scan(ruleOutputName, "clicked = output('onSave');")[0]).toMatchObject({
      ruleId: 'angular-doctor/output-name',
      severity: 'info',
    });
    expect(scan(ruleOutputName, "changed = output('valueChanged');")).toHaveLength(0);
    expect(scan(ruleInputDomName, 'title = input<string>();')[0]?.ruleId).toBe(
      'angular-doctor/input-dom-name',
    );
    expect(scan(ruleInputDomName, 'label = input<string>();')).toHaveLength(0);
    const component = '@Component({ template: "" }) export class Example {';
    expect(scan(rulePreferHttpResource, `${component} this.http.get('/a'); }`)).toHaveLength(1);
    expect(scan(rulePreferHttpResource, `${component} this.http.post('/a', {}); }`)).toHaveLength(
      0,
    );
    expect(scan(rulePreferDocumentToken, `${component} document.body; }`)).toHaveLength(1);
    expect(scan(rulePreferDocumentToken, `${component} this.document.body; }`)).toHaveLength(0);
    expect(scan(rulePreferIsDevMode, 'if (environment.production) {}')[0]).toMatchObject({
      ruleId: 'angular-doctor/prefer-is-dev-mode',
      severity: 'info',
    });
    expect(
      scan(
        ruleQueryInLifecycle,
        `${component} ngAfterViewInit(): void { this.child = this.viewChild(); } }`,
      )[0]?.ruleId,
    ).toBe('angular-doctor/query-in-lifecycle');
    expect(scan(ruleHostViaElementRef, 'el.nativeElement.classList.add("on");')[0]?.ruleId).toBe(
      'angular-doctor/host-via-element-ref',
    );
  });

  it('reads the Tailwind major and flags v3 syntax only for v4 projects', () => {
    expect(tailwindMajorFromPackageJson('{"devDependencies":{"tailwindcss":"^4.1.12"}}')).toBe(4);
    expect(tailwindV3InStylesheet('@tailwind base;', '/tmp/styles.css')[0]?.ruleId).toBe(
      'angular-doctor/tailwind-v3-syntax',
    );

    const modern = mkdtempSync(join(tmpdir(), 'ng-doctor-tw4-'));
    writeFileSync(join(modern, 'package.json'), '{"devDependencies":{"tailwindcss":"^4.0.0"}}');
    writeFileSync(join(modern, 'styles.css'), '@tailwind utilities;');
    writeFileSync(join(modern, 'tailwind.config.js'), 'module.exports = {};');
    expect(runTailwindV3Check(modern).length).toBeGreaterThanOrEqual(2);

    const legacy = mkdtempSync(join(tmpdir(), 'ng-doctor-tw3-'));
    mkdirSync(join(legacy, 'src'));
    writeFileSync(join(legacy, 'package.json'), '{"devDependencies":{"tailwindcss":"^3.4.0"}}');
    writeFileSync(join(legacy, 'src', 'styles.css'), '@tailwind base;');
    expect(runTailwindV3Check(legacy)).toHaveLength(0);
  });
});

describe('prefer-document-token', () => {
  it('ignores a local variable bound to inject(DOCUMENT)', () => {
    const content = [
      `import { Component, inject } from '@angular/core';`,
      `import { DOCUMENT } from '@angular/common';`,
      `@Component({ template: '' })`,
      `export class Page {`,
      `  private readonly document = inject(DOCUMENT);`,
      `  open(): void { const document = this.document; document.title = 'x'; }`,
      `}`,
    ].join('\n');
    expect(scan(rulePreferDocumentToken, content)).toHaveLength(0);
  });

  it('ignores document assigned from inject(DOCUMENT) in a function body', () => {
    const content = [
      `@Component({ template: '' })`,
      `export class Page {`,
      `  open(): void { const document = inject(DOCUMENT); document.body.classList.add('on'); }`,
      `}`,
    ].join('\n');
    expect(scan(rulePreferDocumentToken, content)).toHaveLength(0);
  });

  it('ignores document mentioned in comments and strings', () => {
    const content = [
      `@Component({ template: '' })`,
      `export class Page {`,
      `  // Do not use document.title here.`,
      `  readonly hint = 'document.title';`,
      `}`,
    ].join('\n');
    expect(scan(rulePreferDocumentToken, content)).toHaveLength(0);
  });

  it('still flags the unresolved global document', () => {
    const content = `@Component({ template: '' }) export class Page { open() { document.title = 'x'; } }`;
    expect(scan(rulePreferDocumentToken, content)[0]?.ruleId).toBe(
      'angular-doctor/prefer-document-token',
    );
  });
});

describe('effect-writes-state', () => {
  it('ignores an effect that only sets the browser tab title', () => {
    const content = [
      `@Component({ template: '' })`,
      `export class Page {`,
      `  constructor() { effect(() => { this.title.setTitle(this.name()); }); }`,
      `}`,
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(0);
  });

  it('ignores writes to a signal owned by an injected service', () => {
    const content = [
      `@Component({ template: '' })`,
      `export class Page {`,
      `  private readonly store = inject(Store);`,
      `  constructor() { effect(() => { this.store.count.set(1); }); }`,
      `}`,
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(0);
  });

  it('ignores non-signal set and update receivers', () => {
    const content = `effect(() => { this.cache.set('k', 1); this.params = this.params.set('a', 'b'); });`;
    expect(scan(ruleEffectWritesState, content)).toHaveLength(0);
  });

  it('ignores effect() calls on other objects', () => {
    const content = [
      `export class Page {`,
      `  readonly count = signal(0);`,
      `  run() { this.fx.effect(() => { this.count.set(1); }); }`,
      `}`,
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(0);
  });

  it('flags a write to a signal field declared in the same file', () => {
    const content = [
      `export class Page {`,
      `  readonly count = signal(0);`,
      `  constructor() { effect(() => { this.count.set(1); }); }`,
      `}`,
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(1);
  });

  it('flags a write to a local signal variable', () => {
    const content = `const count = signal(0); effect(() => { count.update((v) => v + 1); });`;
    expect(scan(ruleEffectWritesState, content)).toHaveLength(1);
  });
});

describe('ng-model-name', () => {
  const file = '/tmp/src/app/edit.html';

  it('ignores ngModel outside a form', () => {
    expect(scan(ruleNgModelName, '<input [(ngModel)]="name" />', file)).toHaveLength(0);
  });

  it('flags ngModel without a name inside a form', () => {
    expect(scan(ruleNgModelName, '<form><input [(ngModel)]="name" /></form>', file)).toHaveLength(
      1,
    );
  });

  it('ignores standalone ngModel inside a form', () => {
    const html =
      '<form><input [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" /></form>';
    expect(scan(ruleNgModelName, html, file)).toHaveLength(0);
  });

  it('ignores ngModel with a bound name inside a form', () => {
    const html = '<form><input [(ngModel)]="name" [name]="fieldName" /></form>';
    expect(scan(ruleNgModelName, html, file)).toHaveLength(0);
  });
});

describe('effect-writes-state edges', () => {
  it('flags writes to model and linkedSignal fields', () => {
    const content = [
      'export class A {',
      '  value = model(0);',
      '  doubled = linkedSignal(() => 0);',
      '  constructor() { effect(() => { this.value.set(1); }); effect(() => { this.doubled.set(2); }); }',
      '}',
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(2);
  });

  it('flags same-file signal writes inside afterRenderEffect', () => {
    const content = [
      'export class A {',
      '  readonly count = signal(0);',
      '  constructor() { afterRenderEffect(() => { this.count.set(1); }); }',
      '}',
    ].join('\n');
    expect(scan(ruleEffectWritesState, content)).toHaveLength(1);
  });

  it('records the accepted trade-off: one shadowed document suppresses the file', () => {
    // Scope-blind by design: the rule cannot tell which method sees the
    // local binding, so it prefers silence over a false positive.
    const content = [
      '@Component({ template: "" })',
      'export class A {',
      '  a(): void { const document = inject(DOCUMENT); document.title = "a"; }',
      '  b(): void { document.title = "b"; }',
      '}',
    ].join('\n');
    expect(scan(rulePreferDocumentToken, content)).toHaveLength(0);
  });

  it('still flags ngModel when options are bound to a variable', () => {
    // A variable could hold { updateOn: 'blur' } without standalone, so
    // the name is still required; the suggestion names the way out.
    const html = '<form><input [(ngModel)]="n" [ngModelOptions]="opts" /></form>';
    expect(scan(ruleNgModelName, html, '/tmp/a.html')).toHaveLength(1);
  });
});
