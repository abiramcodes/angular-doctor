import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ruleClickWithoutKeyboard,
  ruleControlMissingLabel,
  ruleImgAlt,
  rulePositiveTabindex,
} from '../src/rules/audit/accessibility-rules.js';
import { runDeadCodeCheck } from '../src/rules/audit/dead-code-rules.js';
import {
  ruleClientSecret,
  ruleInnerHtml,
  ruleTargetBlank,
  runEnvFileCheck,
} from '../src/rules/audit/security-rules.js';
import type { RuleContext } from '../src/rules/diag-helpers.js';
import { explainRule, listRuleCards } from '../src/rules/registry.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function ctx(file: string, content: string, files?: string[]): RuleContext {
  return { project, file, content, files };
}

describe('security rules', () => {
  it('flags a client secret and ignores environment reads and placeholders', () => {
    const found = ruleClientSecret(
      ctx(
        '/tmp/src/app/keys.ts',
        [
          "const apiKey = 'not-a-real-secret';",
          'const fromEnv = process.env.API_KEY;',
          "const placeholder = 'changeme-value';",
          "const published = 'sk_live_51Habc123456789';",
        ].join('\n'),
      ),
    );
    expect(found.map((item) => item.line)).toEqual([1, 4]);
    expect(found.every((item) => item.ruleId === 'angular-doctor/client-secret')).toBe(true);
    expect(found.every((item) => item.severity === 'error')).toBe(true);
  });

  it('flags a real env file and ignores the example', () => {
    const root = join(tmpdir(), `ng-doctor-env-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    writeFileSync(join(root, '.env'), 'API=1\n');
    writeFileSync(join(root, '.env.example'), 'API=\n');
    const found = runEnvFileCheck({
      ...ctx(root, ''),
      project: { ...project, root, workspaceRoots: [root] },
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.file.endsWith('.env')).toBe(true);
    expect(found[0]?.file.endsWith('.example')).toBe(false);
    expect(found[0]?.severity).toBe('error');
  });

  it('flags innerHTML bindings and assignments', () => {
    const found = ruleInnerHtml(
      ctx('/tmp/src/app/view.ts', '<div [innerHTML]="html"></div>\nel.innerHTML = value;\n'),
    );
    expect(found).toHaveLength(2);
    expect(found[0]?.ruleId).toBe('angular-doctor/inner-html');
  });

  it('flags target blank only when rel is missing', () => {
    const found = ruleTargetBlank(
      ctx(
        '/tmp/src/app/view.html',
        [
          '<a target="_blank" href="https://angular.dev">Docs</a>',
          '<a target="_blank" rel="noopener" href="https://angular.dev">Safe</a>',
          `<a [target]="'_blank'" rel="noreferrer">Also safe</a>`,
        ].join('\n'),
      ),
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.line).toBe(1);
  });
});

describe('accessibility rules', () => {
  it('flags an image without alt text', () => {
    const file = '/tmp/src/app/view.html';
    const content = '<img src="a.png" />\n<img alt="" />\n<img aria-hidden="true" />';
    expect(ruleImgAlt(ctx(file, content))).toHaveLength(1);
  });

  it('flags click handlers on non-interactive elements', () => {
    const content = [
      '<div (click)="save()">Save</div>',
      '<div (click)="save()" (keydown.enter)="save()">Save</div>',
      '<button (click)="save()">Save</button>',
    ].join('\n');
    expect(ruleClickWithoutKeyboard(ctx('/tmp/view.html', content))).toHaveLength(1);
  });

  it('flags a positive tabindex', () => {
    const content =
      '<div tabindex="2"></div>\n<span tabindex="0"></span>\n<button [tabindex]="-1">';
    const found = rulePositiveTabindex(ctx('/tmp/view.html', content));
    expect(found).toHaveLength(1);
    expect(found[0]?.message).toContain('2');
  });

  it('flags a control with no label', () => {
    const content = [
      '<input />',
      '<label for="name">Name</label>',
      '<input id="name" />',
      '<input aria-label="Email" />',
      '<input type="hidden" />',
    ].join('\n');
    const found = ruleControlMissingLabel(ctx('/tmp/view.html', content));
    expect(found).toHaveLength(1);
    expect(found[0]?.line).toBe(1);
  });
});

describe('dead code', () => {
  it('reports an unused import and skips an export that a spec imports', () => {
    const root = join(tmpdir(), `ng-doctor-dead-${Date.now()}`);
    const src = join(root, 'src', 'app');
    mkdirSync(src, { recursive: true });
    const widget = join(src, 'widget.ts');
    const orphan = join(src, 'orphan.ts');
    const entry = join(src, 'main.ts');
    writeFileSync(widget, "import { Unused } from './missing';\nexport class Widget {}\n");
    writeFileSync(orphan, 'export class Orphan {}\n');
    writeFileSync(entry, 'export class Main {}\n');
    writeFileSync(join(src, 'widget.spec.ts'), "import { Widget } from './widget';\n");
    const found = runDeadCodeCheck({
      project: { ...project, root, workspaceRoots: [root] },
      file: root,
      content: '',
      files: [widget, orphan, entry],
    });
    const imports = found.filter(
      (item) => item.ruleId === 'angular-doctor/cleanup-unused-imports-hint',
    );
    const exports = found.filter((item) => item.ruleId === 'angular-doctor/unused-export');
    expect(imports.map((item) => item.message)).toEqual(['Import Unused is never used.']);
    expect(imports[0]?.severity).toBe('info');
    expect(exports.map((item) => item.file)).toEqual([orphan]);
    expect(exports[0]?.severity).toBe('warning');
  });
});

describe('rule catalog', () => {
  it('explains a known rule and rejects an unknown id', () => {
    const rule = explainRule('angular-doctor/client-secret');
    expect(rule.category).toBe('security');
    expect(rule.defaultSeverity).toBe('error');
    expect(rule.summary).toContain('secret');
    expect(() => explainRule('angular-doctor/not-a-rule')).toThrow(/Unknown rule/);
  });

  it('filters the catalog by category', () => {
    const security = listRuleCards('security').map((rule) => rule.id);
    expect(security).toContain('angular-doctor/client-secret');
    expect(security).not.toContain('angular-doctor/img-alt');
  });
});
