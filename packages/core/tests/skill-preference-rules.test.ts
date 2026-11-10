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
import {
  ruleNgContentInControlFlow,
  ruleTemplateArrowNotCalled,
} from '../src/rules/preferences/templates.js';
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
  it('flags an effect that writes a signal and ignores a read-only effect', () => {
    const found = scan(
      ruleEffectWritesState,
      'effect(() => { this.count.set(1); }); effect(() => this.count());',
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
    expect(scan(rulePreferProvideHttpClient, 'imports: [HttpClientModule]')[0]?.severity).toBe(
      'warning',
    );
    expect(
      scan(rulePreferFunctionalInterceptor, 'class Auth implements HttpInterceptor {}')[0]?.ruleId,
    ).toBe('angular-doctor/prefer-functional-interceptor');
    expect(scan(rulePreferFunctionalInterceptor, 'provide: HTTP_INTERCEPTORS')).toHaveLength(1);
  });

  it('flags withIncrementalHydration only on Angular 22+', () => {
    const source = 'provideClientHydration(withIncrementalHydration())';
    expect(scan(ruleDeprecatedIncrementalHydration, source)).toHaveLength(1);
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
    expect(scan(ruleNgModelName, '<input [(ngModel)]="name" />', '/tmp/a.html')[0]?.ruleId).toBe(
      'angular-doctor/ng-model-name',
    );
    expect(
      scan(ruleNgModelName, '<input name="user" [(ngModel)]="name" />', '/tmp/a.html'),
    ).toHaveLength(0);
  });

  it('flags projected content inside control flow and uncalled template arrows', () => {
    expect(
      scan(ruleNgContentInControlFlow, '@if (show) { <ng-content /> }', '/tmp/a.html'),
    ).toHaveLength(1);
    expect(scan(ruleNgContentInControlFlow, '<ng-content />', '/tmp/a.html')).toHaveLength(0);
    expect(
      scan(ruleTemplateArrowNotCalled, '<button (click)="() => save()"></button>', '/tmp/a.html'),
    ).toHaveLength(1);
    const wrapped = scan(
      ruleTemplateArrowNotCalled,
      '@Component({ template: \'<button (click)="() => save()"></button>\' })',
    );
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]?.column).toBeGreaterThan(20);
    expect(
      scan(
        ruleTemplateArrowNotCalled,
        '<button (click)="count.update((c) => c + 1)"></button>',
        '/tmp/a.html',
      ),
    ).toHaveLength(0);
  });

  it('reports info preferences without promoting them to warnings', () => {
    expect(
      scan(rulePreferSignalForms, "import { FormGroup, FormBuilder } from '@angular/forms';")[0],
    ).toMatchObject({ ruleId: 'angular-doctor/prefer-signal-forms', severity: 'info' });
    expect(scan(ruleOutputName, "clicked = output('onSave');")[0]?.severity).toBe('info');
    expect(scan(ruleOutputName, "changed = output('valueChanged');")).toHaveLength(0);
    expect(scan(ruleInputDomName, 'title = input<string>();')).toHaveLength(1);
    expect(scan(ruleInputDomName, 'label = input<string>();')).toHaveLength(0);
    const component = '@Component({ template: "" }) export class Example {';
    expect(scan(rulePreferHttpResource, `${component} this.http.get('/a'); }`)).toHaveLength(1);
    expect(scan(rulePreferHttpResource, `${component} this.http.post('/a', {}); }`)).toHaveLength(
      0,
    );
    expect(scan(rulePreferDocumentToken, `${component} document.body; }`)).toHaveLength(1);
    expect(scan(rulePreferDocumentToken, `${component} this.document.body; }`)).toHaveLength(0);
    expect(scan(rulePreferIsDevMode, 'if (environment.production) {}')[0]?.severity).toBe('info');
    expect(
      scan(
        ruleQueryInLifecycle,
        `${component} ngAfterViewInit(): void { this.child = this.viewChild(); } }`,
      ),
    ).toHaveLength(1);
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
