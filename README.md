# Angular Doctor

Deterministic, fast health scans for Angular codebases and coding agents. Ships a CLI health score, categorized diagnostics, and an agent-ready report, with a hybrid **Oxlint + template ESLint** lint stack tuned for Angular.

## Quick start

```bash
npx @abiramcodes/angular-doctor@latest
npx @abiramcodes/angular-doctor@latest --verbose --scope changed
npx @abiramcodes/angular-doctor@latest --category security
npx @abiramcodes/angular-doctor@latest rules list
npx @abiramcodes/angular-doctor@latest --colors pastel
npx @abiramcodes/angular-doctor@latest rules explain angular-doctor/client-secret
npx @abiramcodes/angular-doctor@latest install
```

Requires Node.js 20.19 or newer. Run it in an Angular or Nx workspace.

Develop this repo:

```bash
pnpm install
pnpm build
pnpm doctor:fixture
```

`--colors` chooses `default` (the normal terminal colors), `pastel`, or `velvet`. The default is `default`.

## Development

Node `>=20.19` and pnpm `12.6` (see `packageManager` in the root `package.json`).

```bash
pnpm install
pnpm build
```

`pnpm build` compiles `@angular-doctor/core` and the `angular-doctor` CLI into `dist`. Scans run that output, not the TypeScript source.

From the repo root:

```bash
pnpm run doctor -- fixtures/sample-app
pnpm run doctor:fixture
```

From the sample app:

```bash
cd fixtures/sample-app
pnpm run doctor
```

Use `pnpm run doctor`. `pnpm doctor` is pnpm’s own install check.

After you edit source, rebuild before scanning again, or the last build is what runs:

```bash
pnpm --filter @angular-doctor/core build
pnpm --filter @abiramcodes/angular-doctor build
```

Rebuild core when a rule, score, or report changes. Rebuild the CLI when the terminal output changes. `pnpm build` rebuilds both.

Other local commands:

```bash
pnpm test
pnpm typecheck
pnpm run format
pnpm run lint:fix
pnpm docs:dev
pnpm docs:build
```

`pnpm docs:dev` serves the public website. `pnpm docs:build` prerenders each page to HTML.

## Monorepo layout

| Path                      | Role                                                  |
| ------------------------- | ----------------------------------------------------- |
| `packages/core`           | Diagnostic engine, scoring, Markdown reports          |
| `packages/angular-doctor` | CLI binary `angular-doctor`                           |
| `fixtures/sample-app`     | Angular 22 sample workspace for integration tests     |
| `apps/docs`               | Public angular.doctor site (landing, docs, changelog) |
| `skills/angular-doctor`   | Agent skill + triage playbook                         |

## Lint stack (hybrid)

- **TypeScript / JavaScript:** [Oxlint](https://oxc.rs/docs/guide/usage/linter) (primary, fast path).
- **HTML templates:** ESLint + `@angular-eslint` template rules only (Angular still needs a template parser). Stub runner in v0.1. Install peers to enable the next phase.
- **Angular Doctor rules:** Built-in high-leverage checks (control flow, `inject()`, `@for` track, NgModule in modern apps, sanitizer bypass).

## Configuration

`angular-doctor.config.json`, `angular-doctor.config.ts`, or `package.json#angularDoctor`:

```json
{
  "reportPath": "reports/angular-doctor-report.md",
  "ignore": ["**/legacy/**"]
}
```

When violations exist, **`angular-doctor-report.md`** is written for agents. Clean scans print only the score.

The score counts each rule once. An error costs 1.5 points and a warning costs 0.75. Info findings do not lower the score, and repeating one rule does not lower it again. `--category` filters the findings list. The score stays the full scan. `rules list` and `rules explain` show the built-in rules grouped by category.

## Style guide rules

Built-in rules map to the [Angular coding style guide](https://angular.dev/style-guide). Naming and project-layout findings are **warning/info only** (they do not use error severity).

| Rule ID                                      | Style guide area                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `angular-doctor/file-hyphen-case`            | Hyphenated file names                                                                                                                            |
| `angular-doctor/missing-spec-file`           | `.spec.ts` pairing                                                                                                                               |
| `angular-doctor/filename-class-mismatch`     | File name matches class                                                                                                                          |
| `angular-doctor/component-file-set-mismatch` | Unified component file set                                                                                                                       |
| `angular-doctor/generic-filename`            | Avoid `helpers` / `utils` / `common`                                                                                                             |
| `angular-doctor/naming-convention-mix`       | Suffix mix among UI files imported from `app.ts`. Skips `app.config.ts`, `app.routes.ts`, `main.ts`, `bootstrap.ts`, and `federation.config.mjs` |
| `angular-doctor/project-layout`              | `src/main.ts` bootstrap                                                                                                                          |
| `angular-doctor/type-based-folder`           | Feature folders vs `components/` / `services/`                                                                                                   |
| `angular-doctor/one-concept-per-file`        | One component per file                                                                                                                           |
| `angular-doctor/prefer-readonly-signals`     | `readonly` on signal APIs                                                                                                                        |
| `angular-doctor/lifecycle-interface`         | `implements OnInit`, etc.                                                                                                                        |
| `angular-doctor/lifecycle-hook-complexity`   | Small lifecycle hooks                                                                                                                            |
| `angular-doctor/member-order`                | DI/inputs before methods                                                                                                                         |
| `angular-doctor/generic-event-handler`       | Action-named handlers                                                                                                                            |
| `angular-doctor/template-complexity`         | Prefer `computed()` for heavy template logic                                                                                                     |

Configure per rule via `angular-doctor.config.json` → `rules`.

## Performance rules

Static checks for [NgOptimizedImage](https://angular.dev/guide/image-optimization), [change detection](https://angular.dev/best-practices/runtime-performance), and a leftover [`@angular/animations`](https://angular.dev/guide/legacy-animations) dependency. LCP `priority`, preconnect, automatic `srcset`, and slow computations are not flagged: those need a running app or DevTools.

| Rule ID                                          | Severity | What it checks                                                                                                                                 |
| ------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular-doctor/prefer-ng-optimized-image`       | info     | `<img>` uses `src` or `[src]` instead of `ngSrc`                                                                                               |
| `angular-doctor/ng-src-dimensions`               | warning  | `ngSrc` image is missing `width` or `height` and does not use `fill`                                                                           |
| `angular-doctor/ng-src-fill-dimensions`          | warning  | `fill` is combined with `width` or `height`                                                                                                    |
| `angular-doctor/ng-src-placeholder-size`         | info     | `placeholder` data URL decodes to more than 4KB                                                                                                |
| `angular-doctor/explicit-eager-change-detection` | info     | `ChangeDetectionStrategy.Default` or `Eager` is set explicitly                                                                                 |
| `angular-doctor/deprecated-animations`           | error    | `package.json` still lists `@angular/animations` ([legacy animations guide](https://angular.dev/guide/legacy-animations))                      |
| `angular-doctor/zone-js`                         | warning  | `zone.js` is still a dependency or import on Angular 20+ ([zoneless](https://angular.dev/guide/zoneless))                                      |
| `angular-doctor/ng-deep`                         | warning  | `::ng-deep`, `/deep/`, or `>>>` pierces view encapsulation                                                                                     |
| `angular-doctor/typescript-strict`               | warning  | `compilerOptions.strict` is not true                                                                                                           |
| `angular-doctor/strict-templates`                | warning  | `angularCompilerOptions.strictTemplates` is not true                                                                                           |
| `angular-doctor/prefer-take-until-destroyed`     | error    | `Subject` or `BehaviorSubject` torn down in `ngOnDestroy` ([takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)) |
| `angular-doctor/subject-not-cleaned-up`          | error    | Used `Subject` or `BehaviorSubject` in a component or directive is never completed or unsubscribed                                             |

## Host bindings

| Rule ID                               | Severity | What it checks                                                                                                                       |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `angular-doctor/prefer-host-bindings` | error    | `@HostBinding` or `@HostListener` instead of the `host` option ([host elements](https://angular.dev/guide/components/host-elements)) |

## Skill preference rules

Warnings are syntax the Angular skill treats as the wrong tool. Info findings are preferences that existing code can still justify. Complex-component and repeated-template checks compare text fingerprints. They do not parse the Angular template AST.

| Rule ID                                           | Severity | What it checks                                                                     |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------------------- |
| `angular-doctor/effect-writes-state`              | warning  | `effect()` calls `.set()` or `.update()`                                           |
| `angular-doctor/impure-pipe`                      | warning  | `@Pipe({ pure: false })`                                                           |
| `angular-doctor/pipe-name-hyphen`                 | warning  | Pipe `name` contains a hyphen                                                      |
| `angular-doctor/inject-pipe`                      | warning  | A pipe class is injected                                                           |
| `angular-doctor/prefer-provide-http-client`       | warning  | `HttpClientModule`                                                                 |
| `angular-doctor/prefer-functional-interceptor`    | warning  | `HTTP_INTERCEPTORS` or `implements HttpInterceptor`                                |
| `angular-doctor/deprecated-incremental-hydration` | warning  | `withIncrementalHydration()` on Angular 22+                                        |
| `angular-doctor/form-field-owned-attrs`           | warning  | `[disabled]`, `[readonly]`, or `[value]` on `[formField]`                          |
| `angular-doctor/ng-model-name`                    | warning  | `[(ngModel)]` without `name`                                                       |
| `angular-doctor/ng-content-in-control-flow`       | warning  | `<ng-content>` inside `@if`, `@for`, `@switch`, or `<ng-template>`                 |
| `angular-doctor/template-arrow-not-called`        | warning  | Event binding is an arrow function or uses a block body                            |
| `angular-doctor/tailwind-v3-syntax`               | warning  | Tailwind v3 `@tailwind` or `tailwind.config` when Tailwind 4 is installed          |
| `angular-doctor/prefer-signal-forms`              | info     | `FormControl`, `FormGroup`, `FormArray`, `FormBuilder`, `NgForm`, or `FormsModule` |
| `angular-doctor/output-name`                      | info     | Output named `on…` or `click`, `submit`, `change`, `input`, `focus`                |
| `angular-doctor/input-dom-name`                   | info     | Input named `id`, `title`, `role`, `tabIndex`, or `lang`                           |
| `angular-doctor/prefer-http-resource`             | info     | `http.get()` in a component or directive                                           |
| `angular-doctor/prefer-document-token`            | info     | Global `document.` in a component or directive                                     |
| `angular-doctor/prefer-is-dev-mode`               | info     | `environment.production`                                                           |
| `angular-doctor/query-in-lifecycle`               | info     | Signal query read in `ngAfterViewInit` or `ngAfterContentInit`                     |
| `angular-doctor/host-via-element-ref`             | info     | `nativeElement` sets `classList`, `style`, or `setAttribute`                       |
| `angular-doctor/complex-component`                | info     | Template over 80 lines, more than 12 methods, or more than 8 control-flow blocks   |
| `angular-doctor/repeated-template`                | info     | The same 6-tag or 15-line template block appears in another component              |
| `angular-doctor/repeated-component-logic`         | info     | A method body of at least 8 lines matches a method in another component            |

## Security, accessibility, and dead code

Static text checks. They do not call a secret scanner or a template parser.

| Rule ID                                      | Severity | What it checks                                                                                        |
| -------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `angular-doctor/client-secret`               | error    | A string literal in client code looks like a secret                                                   |
| `angular-doctor/env-file`                    | error    | `.env`, `.env.local`, `.env.development`, `.env.production`, or `.env.*.local` is in the project tree |
| `angular-doctor/inner-html`                  | warning  | `[innerHTML]`, `bind-innerHTML`, or `.innerHTML =`                                                    |
| `angular-doctor/target-blank`                | warning  | `target="_blank"` without `rel="noopener"` or `rel="noreferrer"`                                      |
| `angular-doctor/img-alt`                     | warning  | `<img>` has neither `alt` nor `aria-hidden="true"`                                                    |
| `angular-doctor/click-without-keyboard`      | warning  | `(click)` on `div`, `span`, `section`, or `article` without a key handler                             |
| `angular-doctor/positive-tabindex`           | warning  | `tabindex` greater than 0                                                                             |
| `angular-doctor/control-missing-label`       | warning  | `input`, `textarea`, or `select` has no label                                                         |
| `angular-doctor/cleanup-unused-imports-hint` | info     | A named import is never used again in the file                                                        |
| `angular-doctor/unused-export`               | warning  | An exported class, function, or const is never used. Specs count as use. Entry files are skipped      |

## Official migrations

Reports and `angular-doctor migrations` link [angular.dev/reference/migrations](https://angular.dev/reference/migrations) and list matching `ng generate @angular/core:*` commands (standalone, control flow, inject, signal inputs/outputs/queries, lazy routes, ngClass/ngStyle, CommonModule, router testing, `@Service`, and others). Use `--dry-run` first. Individual schematics only—there is no single “all signals” migration.

## Format and lint

From the repo root:

```bash
pnpm run format
pnpm run lint:fix
pnpm run fix
```

`format` runs `pnpm exec oxfmt`. `lint:fix` runs `pnpm exec oxlint --fix-suggestions`. A Husky `pre-push` hook runs both. If they change files, the push stops until those fixes are committed.

`pnpm doctor` is pnpm’s own install check. Run this repo’s scanner with `pnpm run doctor` or `pnpm run doctor:fixture`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for where a new rule lives, how it is registered, and how to test it.

## Agent skill

```bash
npx @abiramcodes/angular-doctor@latest install
```

Agents should run `npx @abiramcodes/angular-doctor@latest --verbose --scope changed` after edits and read `angular-doctor-report.md` when present.

## Recommended skill

The scan report stands on its own. The official [angular/skills](https://github.com/angular/skills) `angular-developer` skill is an optional cross-check when it is already installed. Install it when you want that extra review:

```bash
npx skills add https://github.com/angular/skills
```

## License

MIT
