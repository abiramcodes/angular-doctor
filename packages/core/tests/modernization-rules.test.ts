import { describe, expect, it } from 'vitest';
import { ruleNgClass, ruleNgStyle } from '../src/rules/modernization/bindings.js';
import { ruleLegacyStructuralDirectives } from '../src/rules/modernization/control-flow.js';
import {
  ruleCommonModule,
  ruleNgModuleInModern,
  rulePreferInject,
  ruleStandaloneFalse,
} from '../src/rules/modernization/modules.js';
import {
  ruleBypassSecurity,
  ruleEagerRoute,
  rulePreferServiceDecorator,
  ruleRouterTestingModule,
} from '../src/rules/modernization/platform.js';
import { ruleLegacyInput, ruleLegacyOutput } from '../src/rules/modernization/signals.js';
import type { Diagnostic, ProjectInfo } from '../src/types.js';
import type { RuleContext } from '../src/rules/diag-helpers.js';

function proj(version = '22.0.0'): ProjectInfo {
  return {
    root: '/tmp',
    name: 'app',
    kind: 'angular-cli',
    angularVersion: version,
    workspaceRoots: ['/tmp'],
  };
}

function scan(
  rule: (ctx: RuleContext) => Diagnostic[],
  content: string,
  file = '/tmp/src/app/example.ts',
  version = '22.0.0',
): Diagnostic[] {
  return rule({ project: proj(version), file, content });
}

describe('modernization control flow and bindings', () => {
  it('flags legacy structural directives and ignores built-in control flow', () => {
    const found = scan(
      ruleLegacyStructuralDirectives,
      '<p *ngIf="ok"></p>@if (ok) {<p></p>}',
      '/tmp/a.html',
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.ruleId).toBe('angular-doctor/prefer-control-flow');
    expect(
      scan(ruleLegacyStructuralDirectives, '@for (x of xs; track x) {}', '/tmp/a.html'),
    ).toHaveLength(0);
  });

  it('flags ngClass and ngStyle bindings only', () => {
    expect(scan(ruleNgClass, '<p [ngClass]="cls"></p>', '/tmp/a.html')[0]?.ruleId).toBe(
      'angular-doctor/prefer-class-binding',
    );
    expect(scan(ruleNgClass, '<p [class.on]="ok"></p>', '/tmp/a.html')).toHaveLength(0);
    expect(scan(ruleNgStyle, '<p [ngStyle]="sty"></p>', '/tmp/a.html')[0]?.ruleId).toBe(
      'angular-doctor/prefer-style-binding',
    );
    expect(scan(ruleNgStyle, '<p [style.color]="c"></p>', '/tmp/a.html')).toHaveLength(0);
  });
});

describe('modernization modules', () => {
  it('flags constructor injection and skips subclasses forwarding to super()', () => {
    expect(
      scan(rulePreferInject, 'export class A { constructor(private svc: Svc) {} }')[0]?.ruleId,
    ).toBe('angular-doctor/prefer-inject');
    expect(scan(rulePreferInject, 'export class A { constructor() {} }')).toHaveLength(0);
    const child = 'export class A extends Base { constructor(private svc: Svc) { super(svc); } }';
    expect(scan(rulePreferInject, child)).toHaveLength(0);
  });

  it('flags NgModule and standalone false on Angular 17+ only', () => {
    expect(scan(ruleNgModuleInModern, '@NgModule({}) export class M {}')[0]?.ruleId).toBe(
      'angular-doctor/prefer-standalone',
    );
    expect(
      scan(ruleNgModuleInModern, '@NgModule({}) export class M {}', '/tmp/a.ts', '16.2.0'),
    ).toHaveLength(0);
    expect(scan(ruleStandaloneFalse, '@Component({ standalone: false })')[0]?.ruleId).toBe(
      'angular-doctor/standalone-false',
    );
    expect(scan(ruleStandaloneFalse, '@Component({})')).toHaveLength(0);
  });

  it('flags CommonModule and ignores mentions in comments and strings', () => {
    expect(scan(ruleCommonModule, 'imports: [CommonModule]')[0]?.ruleId).toBe(
      'angular-doctor/prefer-common-imports',
    );
    expect(
      scan(ruleCommonModule, '// Do not import CommonModule here.\nexport class A {}'),
    ).toHaveLength(0);
    expect(scan(ruleCommonModule, "const name = 'CommonModule';")).toHaveLength(0);
  });
});

describe('modernization signals decorators', () => {
  it('flags legacy Input and Output decorators on Angular 19+ only', () => {
    expect(scan(ruleLegacyInput, '@Input() name = "";')[0]?.ruleId).toBe(
      'angular-doctor/prefer-signal-input',
    );
    expect(scan(ruleLegacyInput, '@Input() name = "";', '/tmp/a.ts', '18.2.0')).toHaveLength(0);
    expect(scan(ruleLegacyInput, 'name = input("");')).toHaveLength(0);
    expect(scan(ruleLegacyOutput, '@Output() saved = new EventEmitter();')[0]?.ruleId).toBe(
      'angular-doctor/prefer-output-fn',
    );
    expect(scan(ruleLegacyOutput, 'saved = output();')).toHaveLength(0);
  });

  it('ignores legacy decorators mentioned in comments', () => {
    expect(scan(ruleLegacyInput, '// Migrated away from @Input\nexport class A {}')).toHaveLength(
      0,
    );
    expect(scan(ruleLegacyOutput, "const docs = '@Output()';")).toHaveLength(0);
  });
});

describe('modernization platform', () => {
  it('flags RouterTestingModule only in spec files', () => {
    expect(
      scan(ruleRouterTestingModule, 'imports: [RouterTestingModule]', '/tmp/a.spec.ts')[0]?.ruleId,
    ).toBe('angular-doctor/prefer-router-module-testing');
    expect(
      scan(ruleRouterTestingModule, 'imports: [RouterTestingModule]', '/tmp/a.ts'),
    ).toHaveLength(0);
  });

  it('flags @Service candidates only for root-provided injectables', () => {
    expect(
      scan(rulePreferServiceDecorator, "@Injectable({ providedIn: 'root' }) export class S {}")[0]
        ?.ruleId,
    ).toBe('angular-doctor/prefer-service-decorator');
    expect(scan(rulePreferServiceDecorator, '@Injectable() export class S {}')).toHaveLength(0);
    expect(
      scan(
        rulePreferServiceDecorator,
        "@Injectable({ providedIn: 'root' })",
        '/tmp/a.ts',
        '21.2.0',
      ),
    ).toHaveLength(0);
  });

  it('flags eager routes and skips lazy and empty-path shell routes', () => {
    const routes = 'export const routes: Routes = [{ path: "admin", component: AdminPage }];';
    expect(scan(ruleEagerRoute, routes)[0]?.ruleId).toBe('angular-doctor/prefer-lazy-routes');
    const shell = 'export const routes: Routes = [{ path: "", component: ShellPage }];';
    expect(scan(ruleEagerRoute, shell)).toHaveLength(0);
    const lazy =
      'export const routes: Routes = [{ path: "a", loadComponent: () => import("./a") }];';
    expect(scan(ruleEagerRoute, lazy)).toHaveLength(0);
  });

  it('flags sanitizer bypass calls and ignores mentions in comments', () => {
    expect(scan(ruleBypassSecurity, 'this.s.bypassSecurityTrustHtml(x);')[0]?.ruleId).toBe(
      'angular-doctor/security-bypass',
    );
    expect(
      scan(ruleBypassSecurity, '// Never call bypassSecurityTrustHtml.\nexport class A {}'),
    ).toHaveLength(0);
  });
});
