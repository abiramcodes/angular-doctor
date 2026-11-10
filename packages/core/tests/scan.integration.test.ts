import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runScan } from '../src/scan/run-scan.js';

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'fixtures',
  'sample-app',
);

describe('runScan integration', () => {
  it('detects legacy patterns in the sample fixture', async () => {
    const phases: string[] = [];
    let lastCompleted = 0;
    const result = await runScan({
      cwd: fixtureRoot,
      scope: 'full',
      onProgress: (progress) => {
        phases.push(progress.phase);
        lastCompleted = progress.completed;
      },
    });
    expect(phases[0]).toBe('project');
    expect(phases).toContain('rules');
    expect(phases).toContain('score');
    expect(lastCompleted).toBeGreaterThan(0);
    expect(result.project.angularVersion).toMatch(/^22\./);
    expect(result.score).toBeLessThan(100);
    expect(result.diagnostics.some((d) => d.ruleId.includes('prefer-control-flow'))).toBe(true);
    expect(result.reportPath).toBeTruthy();
  });
});
