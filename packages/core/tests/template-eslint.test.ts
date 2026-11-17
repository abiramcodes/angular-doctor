import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runTemplateEslint } from '../src/runners/run-template-eslint.js';

describe('runTemplateEslint', () => {
  it('returns no diagnostics for an empty file list', async () => {
    await expect(runTemplateEslint('/tmp', [])).resolves.toMatchObject({
      diagnostics: [],
      skipped: false,
    });
  });

  it('flags a button without type in a standalone template', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'view.html');
    writeFileSync(file, '<button (click)="save()">Save</button>\n');
    const found = await runTemplateEslint(root, [file], []);
    expect(found.skipped).toBe(false);
    expect(found.diagnostics.some((d) => d.ruleId === 'template-eslint/button-has-type')).toBe(
      true,
    );
  });

  it('flags eqeqeq in an inline component template', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-inline-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'panel.ts');
    writeFileSync(
      file,
      `import { Component } from '@angular/core';\n\n@Component({ template: '<p>{{ a == b }}</p>' })\nexport class Panel {}\n`,
    );
    const found = await runTemplateEslint(root, [], [file]);
    expect(found.skipped).toBe(false);
    expect(found.diagnostics.some((d) => d.ruleId === 'template-eslint/eqeqeq')).toBe(true);
  });

  it('accepts a bound alt and flags a missing alt through alt-text', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-alt-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'view.html');
    writeFileSync(file, '<img [alt]="label" src="a.png" />\n<img src="b.png" />\n');
    const found = await runTemplateEslint(root, [file], []);
    const alt = found.diagnostics.filter((d) => d.ruleId === 'template-eslint/alt-text');
    expect(alt).toHaveLength(1);
    expect(alt[0]?.line).toBe(2);
  });

  it('accepts a control wrapped in a label element', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-label-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'view.html');
    writeFileSync(
      file,
      '<label>Name <input /></label>\n<label for="mail">Mail</label>\n<input id="mail" />\n',
    );
    const found = await runTemplateEslint(root, [file], []);
    expect(
      found.diagnostics.some((d) => d.ruleId === 'template-eslint/label-has-associated-control'),
    ).toBe(false);
  });

  it('flags positive tabindex and click without keyboard through template rules', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-a11y-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'view.html');
    writeFileSync(file, '<div tabindex="2" (click)="save()">Save</div>\n');
    const found = await runTemplateEslint(root, [file], []);
    expect(found.diagnostics.some((d) => d.ruleId === 'template-eslint/no-positive-tabindex')).toBe(
      true,
    );
    expect(
      found.diagnostics.some((d) => d.ruleId === 'template-eslint/click-events-have-key-events'),
    ).toBe(true);
  });

  it('flags a missing alt in an inline component template', async () => {
    const root = join(tmpdir(), `ng-doctor-eslint-inline-alt-${Date.now()}`);
    mkdirSync(root, { recursive: true });
    const file = join(root, 'panel.ts');
    writeFileSync(
      file,
      `import { Component } from '@angular/core';\n\n@Component({ template: '<img src="a.png" /><img [alt]="label" src="b.png" />' })\nexport class Panel {}\n`,
    );
    const found = await runTemplateEslint(root, [], [file]);
    expect(found.diagnostics.filter((d) => d.ruleId === 'template-eslint/alt-text')).toHaveLength(
      1,
    );
  });
});
