import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Diagnostic } from '@angular-doctor/core/types';

const ROOT = '/work/app';

function diag(file: string, message: string): Diagnostic {
  return {
    id: `x:${file}`,
    ruleId: 'angular-doctor/filename-class-mismatch',
    severity: 'warning',
    category: 'hygiene',
    message,
    file,
    line: 1,
    column: 1,
    source: 'angular-doctor',
  };
}

describe('printGroupedFindings location colors', () => {
  const stdout = process.stdout as unknown as { isTTY?: boolean };
  const stderr = process.stderr as unknown as { isTTY?: boolean };
  const prevStdout = stdout.isTTY;
  const prevStderr = stderr.isTTY;
  let lines: string[] = [];

  beforeAll(async () => {
    // scan-progress creates its colors at import time from TTY state, so
    // force a TTY first and only then load the module.
    stdout.isTTY = true;
    stderr.isTTY = true;
    vi.resetModules();
    const { printGroupedFindings } = await import('../src/commands/scan-progress.js');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      printGroupedFindings(
        [
          diag(`${ROOT}/src/a.ts`, 'File stem "a" does not match class "A".'),
          diag(`${ROOT}/src/b.ts`, 'File stem "b" does not match class "B".'),
        ],
        ROOT,
        true,
      );
      lines = log.mock.calls.map((call) => String(call[0]));
    } finally {
      log.mockRestore();
    }
  });

  afterAll(() => {
    stdout.isTTY = prevStdout;
    stderr.isTTY = prevStderr;
  });

  it('dims the whole location line, including a per-file message', () => {
    const varying = lines.find((line) => line.includes('src/b.ts'));
    // One dim span covers path and message: no reset (\x1b[22m) in between,
    // otherwise the message renders bright next to the dim path.
    expect(varying).toBe('    \x1b[2msrc/b.ts:1  File stem "b" does not match class "B".\x1b[22m');
    const plain = lines.find((line) => line.includes('src/a.ts'));
    expect(plain).toBe('    \x1b[2msrc/a.ts:1\x1b[22m');
  });
});
