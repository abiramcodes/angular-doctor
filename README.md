# Angular Doctor

Deterministic, fast health scans for Angular codebases and coding agents. Ships a CLI health score, categorized diagnostics, and an agent-ready report, with a hybrid **Oxlint + template ESLint** lint stack tuned for Angular.

## Quick start

```bash
npx @abiramcodes/angular-doctor@latest
npx @abiramcodes/angular-doctor@latest --verbose --scope changed
npx @abiramcodes/angular-doctor@latest --html
npx @abiramcodes/angular-doctor@latest --category security
npx @abiramcodes/angular-doctor@latest rules list
npx @abiramcodes/angular-doctor@latest --colors pastel
npx @abiramcodes/angular-doctor@latest rules explain angular-doctor/inner-html
npx @abiramcodes/angular-doctor@latest install
```

Requires Node.js 20.19 or newer and Angular 15 or newer. Angular 17+ gets every check; Angular 15–16 run in compat mode with modern checks off. Run it in an Angular or Nx workspace.

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

`pnpm docs:dev` serves the public website. `pnpm docs:build` prerenders each page to HTML. After changing rules, regenerate the docs rule catalog with `node scripts/generate-rule-docs.mjs`.

## Monorepo layout

| Path                      | Role                                                  |
| ------------------------- | ----------------------------------------------------- |
| `packages/core`           | Diagnostic engine, scoring, Markdown reports          |
| `packages/angular-doctor` | CLI binary `angular-doctor`                           |
| `fixtures/sample-app`     | Angular 22 sample workspace for integration tests     |
| `apps/docs`               | Public angular.doctor site (landing, docs, changelog) |
| `skills/angular-doctor`   | Agent skill + triage playbook                         |

## Lint stack (hybrid)

- **TypeScript:** [Oxlint](https://oxc.rs/docs/guide/usage/linter) (primary, fast path). The scan reads `.ts` and `.html` only.
- **HTML templates:** ESLint + `@angular-eslint` template rules, bundled. A curated subset runs over standalone and inline component templates; no extra install needed.
- **Angular Doctor rules:** Built-in high-leverage checks (control flow, `inject()`, `@for` track, NgModule in modern apps, sanitizer bypass).

## Configuration

`angular-doctor.config.json` or `package.json#angularDoctor` (a leftover `angular-doctor.config.ts` is reported as a skipped check instead of being loaded):

```json
{
  "reportPath": "reports/angular-doctor-report.md",
  "ignore": ["**/legacy/**"],
  "reportFormats": ["markdown", "html"]
}
```

When violations exist, **`angular-doctor-report.md`** is written for agents, with findings grouped once per rule. `--html` (or `"html"` in `reportFormats`) also writes a self-contained **`angular-doctor-report.html`** with category tabs. Clean scans print only the score.

Severities are strict by default: correctness, security, and accessibility warnings count as errors, and style-guide infos count as warnings. Two rules stay warnings by design because they call for review rather than a guaranteed break: `angular-doctor/security-bypass` and `angular-doctor/ng-model-name`. There is no level switch; soften or silence a rule per rule under `rules` (for example `"angular-doctor/ng-model-name": "info"` or `"off"`).

An error costs 1.5 points in each file where that rule fires. Repeating it in the same file does not cost more. A warning costs 0.75 once per rule, no matter how many files repeat it. Info findings do not lower the score. The score starts at 100 and does not go below 0. `--category` filters the findings list. The score stays the full scan. `rules list` and `rules explain` show the built-in rules grouped by category.

## When a check is skipped

The scan reads source as text, including strings, comments, and generated code. A check that cannot finish on one file is skipped. The rest of the scan still runs.

The summary lists each skip as a path and a reason:

```text
Skipped checks
  scripts/lib/emit.ts: Invalid regular expression: /\b${names.join('\b/g: Unterminated group
```

Open that path. The same lines are under **Skipped checks** in `angular-doctor-report.md`, and in the `skippedChecks` array when you pass `--json`.

One shape that hits this is a string that looks like an import whose names are not identifiers:

```js
`import { ${names.join(", ")} } from '${pkg}';`;
```

Search the reported file for `import {` inside a quote or a comment. The scan does not list every string that can do this. The path in the message is the file to open.

## Style guide rules

Built-in rules map to the [Angular coding style guide](https://angular.dev/style-guide). Naming and project-layout findings are **warning only** (style-guide infos are promoted to warning; they do not use error severity).

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
| `angular-doctor/template-for-allocation`         | info     | `@for` iterates a method (not a signal read) that returns a new array/object per call                                                          |
| `angular-doctor/getter-in-template`              | error    | A template reads a class getter, which re-runs on every change detection cycle                                                                 |
| `angular-doctor/defer-missing-trigger`           | warning  | `@defer` without an `on`/`when`/prefetch trigger                                                                                               |
| `angular-doctor/prefer-inject-async`             | info     | A root service is only used inside handlers and could load lazily with `injectAsync()` (Angular 22+)                                           |
| `angular-doctor/deprecated-animations`           | error    | `package.json` still lists `@angular/animations` ([legacy animations guide](https://angular.dev/guide/legacy-animations))                      |
| `angular-doctor/zone-js`                         | warning  | `zone.js` is still a dependency or import on Angular 20+ ([zoneless](https://angular.dev/guide/zoneless))                                      |
| `angular-doctor/ng-deep`                         | warning  | `::ng-deep`, `/deep/`, or `>>>` pierces view encapsulation                                                                                     |
| `angular-doctor/typescript-strict`               | error    | `compilerOptions.strict` is not true                                                                                                           |
| `angular-doctor/strict-templates`                | error    | `angularCompilerOptions.strictTemplates` is not true                                                                                           |
| `angular-doctor/prefer-take-until-destroyed`     | error    | `Subject` or `BehaviorSubject` torn down in `ngOnDestroy` ([takeUntilDestroyed](https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed)) |
| `angular-doctor/subject-not-cleaned-up`          | error    | Used `Subject` or `BehaviorSubject` in a component or directive is never completed or unsubscribed                                             |

## Host bindings

| Rule ID                               | Severity | What it checks                                                                                                                       |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `angular-doctor/prefer-host-bindings` | error    | `@HostBinding` or `@HostListener` instead of the `host` option ([host elements](https://angular.dev/guide/components/host-elements)) |

## Skill preference rules

Warnings are syntax the Angular skill treats as the wrong tool. Info findings are preferences that existing code can still justify.

| Rule ID                                           | Severity | What it checks                                                                                                                                                                     |
| ------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular-doctor/effect-writes-state`              | error    | `effect()` calls `.set()` or `.update()` on a signal declared in the same file. Service-owned signals and DOM side effects do not count                                            |
| `angular-doctor/impure-pipe`                      | error    | `@Pipe({ pure: false })`                                                                                                                                                           |
| `angular-doctor/pipe-name-hyphen`                 | warning  | Pipe `name` contains a hyphen                                                                                                                                                      |
| `angular-doctor/inject-pipe`                      | warning  | A pipe class is injected                                                                                                                                                           |
| `angular-doctor/prefer-provide-http-client`       | warning  | `HttpClientModule`                                                                                                                                                                 |
| `angular-doctor/prefer-functional-interceptor`    | warning  | `HTTP_INTERCEPTORS` or `implements HttpInterceptor`                                                                                                                                |
| `angular-doctor/deprecated-incremental-hydration` | warning  | `withIncrementalHydration()` on Angular 22+                                                                                                                                        |
| `angular-doctor/form-field-owned-attrs`           | error    | `[disabled]`, `[readonly]`, or `[value]` on `[formField]`                                                                                                                          |
| `angular-doctor/ng-model-name`                    | warning  | `[(ngModel)]` inside a `<form>` without `name` and without standalone `ngModelOptions`                                                                                             |
| `angular-doctor/ng-content-in-control-flow`       | error    | `<ng-content>` inside `@if`, `@for`, `@switch`, or `<ng-template>`                                                                                                                 |
| `angular-doctor/tailwind-v3-syntax`               | warning  | Tailwind v3 `@tailwind` or `tailwind.config` when Tailwind 4 is installed                                                                                                          |
| `angular-doctor/prefer-signal-forms`              | info     | `FormControl`, `FormGroup`, `FormArray`, `FormBuilder`, `NgForm`, or `FormsModule`                                                                                                 |
| `angular-doctor/prefer-signal-query`              | warning  | `@ViewChild`, `@ViewChildren`, `@ContentChild`, or `@ContentChildren` instead of signal queries (Angular 19+)                                                                      |
| `angular-doctor/output-name`                      | info     | Output named `on…` or `click`, `submit`, `change`, `input`, `focus`                                                                                                                |
| `angular-doctor/input-dom-name`                   | info     | Input named `id`, `title`, `role`, `tabIndex`, or `lang`                                                                                                                           |
| `angular-doctor/prefer-http-resource`             | info     | `http.get()` in a component or directive                                                                                                                                           |
| `angular-doctor/prefer-document-token`            | info     | Unresolved global `document.` in a component or directive; a local binding such as `inject(DOCUMENT)` does not count. A warning when SSR/prerender is configured in `angular.json` |
| `angular-doctor/inject-async-target`              | error    | `injectAsync()` loads a class that is not auto-provided (`@Service` / `providedIn: 'root'`)                                                                                        |
| `angular-doctor/prefer-is-dev-mode`               | info     | `environment.production`                                                                                                                                                           |
| `angular-doctor/query-in-lifecycle`               | info     | Signal query read in `ngAfterViewInit` or `ngAfterContentInit`                                                                                                                     |
| `angular-doctor/host-via-element-ref`             | info     | `nativeElement` sets `classList`, `style`, or `setAttribute`                                                                                                                       |

## Security

Only Angular-specific security is checked here. Secret scanning and generic dead-code detection belong to dedicated tools (a secret scanner in CI, knip), not an Angular health check. Accessibility runs through the bundled template ESLint rules below; unused imports and variables come from Oxlint.

| Rule ID                          | Severity | What it checks                                                                                                                                                                                |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular-doctor/inner-html`      | error    | A direct `.innerHTML =` assignment, or `[innerHTML]` / `bind-innerHTML` in a file that calls `bypassSecurityTrust*`. A plain `[innerHTML]` binding is sanitized by Angular and does not count |
| `angular-doctor/target-blank`    | error    | `target="_blank"` without `rel="noopener"`, `rel="noreferrer"`, or a bound `[rel]`                                                                                                            |
| `angular-doctor/security-bypass` | warning  | A `DomSanitizer` `bypassSecurityTrust*` call                                                                                                                                                  |

## What Angular Doctor does not check

Angular Doctor checks Angular semantics: control flow, signals, DI, forms, sanitizer use, naming, and project layout. Generic code-quality metrics are delegated to tools that measure them properly:

- **Duplication and complexity:** SonarQube / SonarQube Cloud compute duplicated lines and blocks plus cognitive and cyclomatic complexity, with quality gates on top. Earlier versions approximated these with `complex-component`, `repeated-template`, `repeated-component-logic`, and `template-complexity`; those rules were removed in 0.3.0. In enterprise setups that already run SonarQube Cloud, its MCP server gives agents issue search, quality-gate status, and component measures alongside this scanner. `angular-doctor/lifecycle-hook-complexity` is kept because it is Angular-specific (lifecycle hooks should delegate), not a generic complexity metric.
- **Accessibility attributes:** the bundled `@angular-eslint` template rules (`template-eslint/alt-text`, `template-eslint/click-events-have-key-events`, `template-eslint/no-positive-tabindex`, `template-eslint/label-has-associated-control`) understand bound attributes such as `[alt]` and controls wrapped in `<label>` elements.
- **Unused code:** Oxlint (`no-unused-vars`) runs in every scan. Project-wide unused exports belong to knip or Sonar.
- **Secrets:** use a dedicated secret scanner (for example gitleaks) in CI. Public client identifiers such as Firebase web API keys are not secrets.

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
