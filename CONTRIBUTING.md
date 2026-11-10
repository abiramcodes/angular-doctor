# Contributing

Angular Doctor is a pnpm workspace. Rules live in `@angular-doctor/core`. The CLI only parses flags and calls the scan. Agents read `angular-doctor-report.md`. They do not import rule modules.

## Setup

```bash
pnpm install
pnpm run build
pnpm run test
```

Run the scanner with `pnpm run doctor` or `pnpm run doctor:fixture`. `pnpm doctor` is pnpm’s install check, not this project.

Before you push, the Husky `pre-push` hook runs:

```bash
pnpm exec oxfmt
pnpm exec oxlint --fix-suggestions
```

You can run the same checks yourself with `pnpm run fix`. If they edit files, commit those edits before pushing.

## Where a rule lives

Put the check in `packages/core/src/rules/`, in the folder that matches the kind:

| Kind                                                 | Folder                                               |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Style guide                                          | `naming/`, `structure/`, `components/`, `templates/` |
| Official `ng generate` migrations                    | `modernization/`                                     |
| Images and change detection                          | `templates/performance-rules.ts`                     |
| Subscriptions and host bindings                      | `components/`                                        |
| Skill preferences and project-wide dependency checks | `preferences/`, `dependencies/`                      |

One rule, one function. Shared parsing for preference checks stays in `preferences/parse.ts`.

Do not add a barrel `index.ts`. Core publishes each file from the tsdown entry list. A new source file must be added to `packages/core/tsdown.config.ts`.

## Register the rule once

`packages/core/src/rules/registry.ts` exports `builtinPipeline`. That array is the only registration list. Add one `step()` in the matching kind’s span:

- `kind` is `style-guide`, `modernization`, `performance`, `subscription`, `host`, or `skill-preference`. Keep each kind in one contiguous span.
- `reach: 'file'` reads each scanned file. `reach: 'project'` runs once and ignores `--scope` (layout, `package.json`, Tailwind).
- The step’s `rules` cards are the only ids that function may emit. A repeated id, or a finding whose id is not on the step, fails at startup or at scan time.
- Set `defaultSeverity`, `category`, and `migrationId` when a schematic exists.

Keep existing `angular-doctor/...` ids. Reports and configs already use them.

Scan regexes go through `execAll` in `packages/core/src/rules/match.ts`. Do not keep a module-level `/g` regexp and call `exec` on it. A leftover `lastIndex` skips matches in the next file.

## Severity

- **error** for a broken or deprecated contract: sanitizer bypass, `@angular/animations` still in `package.json`, `@HostBinding` / `@HostListener`, a `Subject` torn down in `ngOnDestroy`, or a used `Subject` that is never completed.
- **warning** for a fix the project should make, including missing `@for` track and skill-preference pitfalls.
- **info** for a preference that existing code can still justify.

Style-guide **info** findings do not lower the score. Style-guide **warnings** do. Naming and project-structure rules stay warning or info, not error.

`naming-convention-mix` follows the component tree that starts at `app.ts` and its relative imports. It does not flag `app.config.ts`, `app.routes.ts`, `bootstrap.ts`, `main.ts`, `federation.config.mjs`, or other `*.config.*` and `*.routes.*` files.

## Tests and fixtures

Add a unit test in `packages/core/tests/` that calls the rule function with a small string. Cover the match and a near miss.

When the sample app should show the finding, add a file under `fixtures/sample-app/src/` that still builds with `ng build`. Do not add a dependency the fixture does not install.

`pnpm run test` runs the core unit tests. `packages/core/tests/pipeline.test.ts` checks that every style-guide catalog id is on `builtinPipeline` and that each id appears once. Update `packages/core/src/rules/style-guide-catalog.ts` when you add a style-guide rule, and update the matching table in `README.md`.

## CLI boundary

`packages/angular-doctor` may import `@angular-doctor/core/scan/run-scan`, `types`, and `migrations/registry`. It does not import rule files. A new command belongs there. A new diagnostic belongs in core.

## Angular defaults for new code

Match the report’s own advice when you touch Angular code in this repo:

- Standalone components, `inject()`, `input()` / `output()` / `model()`, and `computed()`.
- Built-in control flow (`@if`, `@for` with `track`, `@switch`) and `class` / `style` bindings.
- Host bindings on the `host` object, not `@HostBinding` or `@HostListener`.
- `takeUntilDestroyed()` for subscriptions. Complete a component-owned `Subject` from `DestroyRef.onDestroy()`, not from a destroy subject in `ngOnDestroy`.
- `NgOptimizedImage` (`ngSrc`, with `width` and `height`, or `fill` without both).
- Do not add `@angular/animations`. Use CSS `animate.enter` and `animate.leave`.

The `angular-developer` skill is optional. Use it when it is installed. The scan report is enough when it is not.
