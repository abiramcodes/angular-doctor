import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { supportTierFor } from '../src/project/detect-project.js';
import { runScan } from '../src/scan/run-scan.js';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'fixtures');

const MODERN_RULES = [
  'angular-doctor/prefer-control-flow',
  'angular-doctor/prefer-standalone',
  'angular-doctor/prefer-common-imports',
  'angular-doctor/prefer-signal-forms',
  'angular-doctor/prefer-http-resource',
  'angular-doctor/inject-async-target',
];

describe('support tiers', () => {
  it('maps versions to tiers', () => {
    expect(supportTierFor('22.2.0')).toBe('full');
    expect(supportTierFor('17.0.0')).toBe('full');
    expect(supportTierFor('16.2.0')).toBe('compat');
    expect(supportTierFor('15.2.0')).toBe('compat');
    expect(supportTierFor('14.2.0')).toBe('unsupported');
    expect(supportTierFor(null)).toBe('compat');
  });

  it('scans an Angular 16 app without anachronistic rules', async () => {
    const result = await runScan({ cwd: join(fixtures, 'sample-app-v16'), scope: 'full' });
    expect(result.supportTier).toBe('compat');
    expect(result.project.supportTier).toBe('compat');
    expect(result.skippedChecks.some((line) => line.startsWith('Compat mode'))).toBe(true);
    const ids = result.diagnostics.map((d) => d.ruleId);
    for (const id of MODERN_RULES) {
      expect(ids).not.toContain(id);
    }
  });

  it('scans an Angular 15 app without takeUntilDestroyed advice', async () => {
    const result = await runScan({ cwd: join(fixtures, 'sample-app-v15'), scope: 'full' });
    expect(result.supportTier).toBe('compat');
    const ids = result.diagnostics.map((d) => d.ruleId);
    for (const id of [...MODERN_RULES, 'angular-doctor/prefer-take-until-destroyed']) {
      expect(ids).not.toContain(id);
    }
  });

  it('stops cleanly below Angular 15', async () => {
    await expect(runScan({ cwd: join(fixtures, 'sample-app-v14'), scope: 'full' })).rejects.toThrow(
      'Angular Doctor needs Angular 15 or newer. Found Angular 14.2.0.',
    );
  });
});
