import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deprecatedAnimationsInPackageJson,
  runDeprecatedAnimationsCheck,
} from '../src/rules/dependencies/deprecated-animations.js';

const file = '/tmp/app/package.json';

function pkg(section: string): string {
  return JSON.stringify(
    {
      name: 'app',
      [section]: { '@angular/animations': '^18.0.0' },
    },
    null,
    2,
  );
}

describe('deprecated animations package.json', () => {
  it.each(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])(
    'flags @angular/animations in %s',
    (section) => {
      const found = deprecatedAnimationsInPackageJson(pkg(section), file);
      expect(found).toHaveLength(1);
      expect(found[0]?.ruleId).toBe('angular-doctor/deprecated-animations');
      expect(found[0]?.severity).toBe('error');
      expect(found[0]?.docsUrl).toBe('https://angular.dev/guide/legacy-animations');
      expect(found[0]?.line).toBeGreaterThan(1);
    },
  );

  it('ignores a package.json that only depends on @angular/core', () => {
    const text = JSON.stringify({ dependencies: { '@angular/core': '^22.0.0' } });
    expect(deprecatedAnimationsInPackageJson(text, file)).toHaveLength(0);
  });

  it('ignores invalid JSON', () => {
    expect(deprecatedAnimationsInPackageJson('{', file)).toHaveLength(0);
  });

  it('skips package.json files under node_modules', () => {
    const root = mkdtempSync(join(tmpdir(), 'angular-doctor-'));
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ dependencies: { '@angular/core': '^22.0.0' } }),
    );
    const nested = join(root, 'node_modules', 'lib');
    mkdirSync(nested, { recursive: true });
    writeFileSync(
      join(nested, 'package.json'),
      JSON.stringify({ dependencies: { '@angular/animations': '^18.0.0' } }),
    );
    expect(runDeprecatedAnimationsCheck(root)).toHaveLength(0);
  });
});
