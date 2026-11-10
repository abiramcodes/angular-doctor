import { describe, expect, it } from 'vitest';
import { ruleComponentSubjects } from '../src/rules/components/subscription-rules.js';
import type { ProjectInfo } from '../src/types.js';

const project: ProjectInfo = {
  root: '/tmp',
  name: 'app',
  kind: 'angular-cli',
  angularVersion: '22.0.0',
  workspaceRoots: ['/tmp'],
};

const file = '/tmp/src/app/listener.ts';

function component(body: string): string {
  return `@Component({ template: '' })\nexport class Example {\n${body}\n}`;
}

function scan(content: string) {
  return ruleComponentSubjects({ project, file, content });
}

describe('component subjects', () => {
  it('flags Subject teardown in ngOnDestroy once', () => {
    const found = scan(
      component(`
        private readonly destroy$ = new Subject<void>();
        ngOnDestroy(): void {
          this.destroy$.next();
          this.destroy$.complete();
        }
      `),
    );
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/prefer-take-until-destroyed']);
    expect(found[0]?.severity).toBe('error');
    expect(found[0]?.docsUrl).toBe('https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed');
  });

  it('flags BehaviorSubject teardown in ngOnDestroy', () => {
    const found = scan(
      component(`
        private state = new BehaviorSubject(0);
        ngOnDestroy(): void {
          this.state.complete();
        }
      `),
    );
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/prefer-take-until-destroyed']);
  });

  it('flags a used subject that is never completed', () => {
    const found = scan(
      component(`
        private readonly clicks$ = new Subject<void>();
        record(): void {
          this.clicks$.next();
        }
      `),
    );
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/subject-not-cleaned-up']);
    expect(found[0]?.severity).toBe('error');
    expect(found[0]?.docsUrl).toBe('https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed');
  });

  it('does not treat takeUntilDestroyed as completing the subject', () => {
    const found = scan(
      component(`
        private readonly clicks$ = new Subject<void>();
        constructor() {
          this.clicks$.pipe(takeUntilDestroyed()).subscribe();
        }
      `),
    );
    expect(found.map((d) => d.ruleId)).toEqual(['angular-doctor/subject-not-cleaned-up']);
  });

  it('accepts completion from DestroyRef.onDestroy', () => {
    const found = scan(
      component(`
        private readonly clicks$ = new Subject<void>();
        private readonly destroyRef = inject(DestroyRef);
        constructor() {
          this.destroyRef.onDestroy(() => {
            this.clicks$.complete();
          });
        }
        record(): void {
          this.clicks$.next();
        }
      `),
    );
    expect(found).toHaveLength(0);
  });

  it('ignores an unused subject field', () => {
    expect(scan(component(`private readonly destroy$ = new Subject<void>();`))).toHaveLength(0);
  });

  it('ignores a subject owned by an injectable service', () => {
    const found = scan(`
      @Injectable({ providedIn: 'root' })
      export class Store {
        private readonly state = new BehaviorSubject(0);
        read(): number {
          return this.state.value;
        }
      }
    `);
    expect(found).toHaveLength(0);
  });
});
