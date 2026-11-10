import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveScanFiles } from '../src/project/resolve-files.js';

describe('resolveScanFiles', () => {
  it('reads TypeScript and HTML only', async () => {
    const root = join(tmpdir(), `ng-doctor-files-${Date.now()}`);
    const src = join(root, 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'app.ts'), 'export class App {}\n');
    writeFileSync(join(src, 'app.html'), '<p>Hi</p>\n');
    writeFileSync(join(src, 'app.spec.ts'), 'export {}\n');
    writeFileSync(join(root, 'script.mjs'), 'export {}\n');
    writeFileSync(join(root, 'script.js'), 'export {}\n');
    writeFileSync(join(root, 'script.cjs'), 'module.exports = {};\n');
    writeFileSync(join(root, 'view.tsx'), 'export {}\n');

    const files = await resolveScanFiles(root, { cwd: root, scope: 'full' });
    const names = files.map((file) => file.slice(root.length + 1)).sort();

    expect(names).toEqual(['src/app.html', 'src/app.ts']);
  });
});
