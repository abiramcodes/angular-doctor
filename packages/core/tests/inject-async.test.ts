import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ruleInjectAsyncTarget,
  rulePreferInjectAsync,
} from '../src/rules/preferences/inject-async.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

function fixture(serviceBody: string, componentBody: string): { file: string; content: string } {
  const root = join(tmpdir(), `ng-doctor-inject-async-${Date.now()}-${Math.random()}`);
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, 'heavy-service.ts'), serviceBody);
  return { file: join(root, 'cmp.ts'), content: componentBody };
}

const lazyComponent = `@Component({ template: '' })
export class Cmp {
  private readonly heavy = injectAsync(
    () => import('./heavy-service').then((m) => m.HeavyService),
  );
}`;

describe('injectAsync target', () => {
  it('flags a lazily loaded service without a root provider', () => {
    const { file, content } = fixture(
      `@Injectable()\nexport class HeavyService {}\n`,
      lazyComponent,
    );
    const found = ruleInjectAsyncTarget({ project, file, content });
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/inject-async-target']);
    expect(found[0]?.severity).toBe('error');
  });

  it('accepts providedIn root and @Service targets', () => {
    for (const body of [
      `@Injectable({ providedIn: 'root' })\nexport class HeavyService {}\n`,
      `@Service()\nexport class HeavyService {}\n`,
    ]) {
      const { file, content } = fixture(body, lazyComponent);
      expect(ruleInjectAsyncTarget({ project, file, content })).toEqual([]);
    }
  });

  it('skips package imports and pre-22 projects', () => {
    const { file } = fixture(`export class HeavyService {}\n`, lazyComponent);
    const external = lazyComponent.replace('./heavy-service', '@scope/heavy');
    expect(ruleInjectAsyncTarget({ project, file, content: external })).toEqual([]);
    expect(
      ruleInjectAsyncTarget({
        project: { ...project, angularVersion: '21.0.0' },
        file,
        content: lazyComponent,
      }),
    ).toEqual([]);
  });
});

describe('prefer injectAsync', () => {
  const handlerOnly = `@Component({ template: '<button (click)="go()">Go</button>' })
export class Cmp {
  private readonly report = inject(ReportService);
  go(): void {
    this.report.run();
  }
}`;

  it('suggests injectAsync when the service is used only in handlers', () => {
    const found = rulePreferInjectAsync({
      project,
      file: '/tmp/src/app/cmp.ts',
      content: handlerOnly,
    });
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/prefer-inject-async']);
  });

  it('stays silent when the service is needed during init', () => {
    const withInit = handlerOnly.replace(
      'go(): void {',
      'ngOnInit(): void {\n    this.report.warm();\n  }\n  go(): void {',
    );
    expect(
      rulePreferInjectAsync({ project, file: '/tmp/src/app/cmp.ts', content: withInit }),
    ).toEqual([]);
  });
});
