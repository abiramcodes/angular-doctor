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
});
