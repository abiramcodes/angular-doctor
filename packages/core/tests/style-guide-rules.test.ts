import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ruleFileHyphenCase,
  ruleGenericFilename,
  ruleNamingConventionMix,
} from '../src/rules/naming/naming-rules.js';
import { ruleGenericEventHandler } from '../src/rules/templates/template-style-rules.js';
import { rulePreferReadonlySignals } from '../src/rules/components/component-class-rules.js';
import { calculateScore } from '../src/score/calculate-score.js';
import type { Diagnostic, ProjectInfo } from '../src/types.js';
import { inferNamingConvention } from '../src/project/infer-naming-convention.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

describe('style guide rules', () => {
  it('flags underscore file names', () => {
    const found = ruleFileHyphenCase({
      project,
      file: '/tmp/src/app/user_profile.ts',
      content: '',
    });
    expect(found[0]?.ruleId).toBe('angular-doctor/file-hyphen-case');
    expect(found[0]?.severity).not.toBe('error');
  });

  it('flags generic filenames', () => {
    const found = ruleGenericFilename({
      project,
      file: '/tmp/src/app/utils.ts',
      content: '',
    });
    expect(found[0]?.ruleId).toBe('angular-doctor/generic-filename');
  });

  it('flags handleClick handlers', () => {
    const found = ruleGenericEventHandler({
      project,
      file: '/tmp/x.html',
      content: '<button (click)="handleClick()"></button>',
    });
    expect(found[0]?.ruleId).toBe('angular-doctor/generic-event-handler');
  });

  it('flags non-readonly signal input', () => {
    const found = rulePreferReadonlySignals({
      project,
      file: '/tmp/x.ts',
      content: 'title = input<string>();',
    });
    expect(found[0]?.ruleId).toBe('angular-doctor/prefer-readonly-signals');
  });

  it('does not penalize score for style-only info diagnostics', () => {
    const diags: Diagnostic[] = [
      {
        id: '1',
        ruleId: 'angular-doctor/generic-filename',
        severity: 'info',
        category: 'hygiene',
        message: 'm',
        file: 'f',
        line: 1,
        column: 1,
        source: 'angular-doctor',
      },
    ];
    expect(calculateScore(diags)).toBe(100);
  });
});

describe('inferNamingConvention', () => {
  it('follows UI files imported from app.ts and ignores config files', () => {
    const root = join(tmpdir(), `ng-doctor-naming-${Date.now()}`);
    const appDir = join(root, 'src', 'app');
    mkdirSync(appDir, { recursive: true });
    const appTs = join(appDir, 'app.ts');
    const panel = join(appDir, 'legacy-panel.component.ts');
    const config = join(appDir, 'app.config.ts');
    const routes = join(appDir, 'app.routes.ts');
    const main = join(root, 'src', 'main.ts');
    const bootstrap = join(appDir, 'bootstrap.ts');
    writeFileSync(
      appTs,
      "import './legacy-panel.component';\n@Component({})\nexport class App {}\n",
    );
    writeFileSync(panel, '@Component({})\nexport class LegacyPanel {}\n');
    writeFileSync(config, 'export const appConfig = {};\n');
    writeFileSync(routes, 'export const routes = [];\n');
    writeFileSync(main, "import { App } from './app/app';\n");
    writeFileSync(bootstrap, 'export function bootstrap() {}\n');
    writeFileSync(join(appDir, 'federation.config.mjs'), 'export default {};\n');

    const snap = inferNamingConvention([
      appTs,
      panel,
      config,
      routes,
      main,
      bootstrap,
      join(appDir, 'federation.config.mjs'),
    ]);
    expect(snap.renderingFiles.has(config)).toBe(false);
    expect(snap.renderingFiles.has(routes)).toBe(false);
    expect(snap.renderingFiles.has(main)).toBe(false);
    expect(snap.renderingFiles.has(bootstrap)).toBe(false);
    expect(snap.renderingFiles.has(appTs)).toBe(true);
    expect(snap.renderingFiles.has(panel)).toBe(true);
    expect(snap.dirModes.get(appDir)).toBe('mixed');

    const flagged = ruleNamingConventionMix({
      project,
      file: config,
      content: 'export const appConfig = {};\n',
      naming: snap,
    });
    expect(flagged).toHaveLength(0);
    const ui = ruleNamingConventionMix({
      project,
      file: appTs,
      content: "import './legacy-panel.component';\n@Component({})\nexport class App {}\n",
      naming: snap,
    });
    expect(ui[0]?.ruleId).toBe('angular-doctor/naming-convention-mix');
  });
});
