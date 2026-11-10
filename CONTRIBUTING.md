# Contributing

Angular Doctor is an MIT-licensed pnpm workspace. Rules live in `@angular-doctor/core`. The CLI parses flags and calls the scan. Agents read `angular-doctor-report.md`. They do not import rule modules.

Questions and bug reports go to [GitHub issues](https://github.com/abiramcodes/angular-doctor/issues). Pull requests target `main`.

Open an issue before a large change: a new command, a scoring change, or a rule that would flag a common pattern. A small doc fix, a failing test, or a rule with a clear match and a near miss can go straight to a pull request.

## Requirements

- Node.js 20.19 or newer (`engines` in the root `package.json`)
- pnpm 12.6.0, the version in `packageManager`
- Git

Enable Corepack so `pnpm` matches that version:

```bash
corepack enable
corepack prepare pnpm@12.6.0 --activate
```

## Setup

```bash
git clone https://github.com/abiramcodes/angular-doctor.git
cd angular-doctor
pnpm install
pnpm run build
pnpm run test
```

`pnpm install` runs Husky through the `prepare` script. The `pre-push` hook will not run if you install with `--ignore-scripts`.

`pnpm build` compiles `@angular-doctor/core` and the CLI into `dist`. Scans run that output. After you edit a rule, score, or report, rebuild core. After you edit terminal output, rebuild the CLI. `pnpm build` rebuilds both.

```bash
pnpm run doctor -- fixtures/sample-app
pnpm run doctor:fixture
```

Use `pnpm run doctor`. `pnpm doctor` is pnpm’s own install check.

## Checks

Run these from the repo root before you push.

| Command                                              | What it does                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm run fix`                                       | Format with oxfmt, then apply oxlint fixes                                   |
| `pnpm exec oxlint`                                   | Lint and report problems. This command does not edit files                   |
| `pnpm test`                                          | Core unit tests (Vitest)                                                     |
| `pnpm typecheck`                                     | `tsc --noEmit` for core and the CLI                                          |
| `pnpm build`                                         | Rebuild core and the CLI                                                     |
| `pnpm --filter @angular-doctor/docs exec vitest run` | Docs unit tests. `pnpm --filter @angular-doctor/docs test` starts watch mode |
| `pnpm docs:build`                                    | Prerender the public site. Run this when you change `apps/docs`              |

`pnpm run fmt` is oxfmt alone. `pnpm run lint:fix` is `oxlint --fix-suggestions` alone. `pnpm run fix` runs both, in that order.

There is no pull-request workflow in this repository yet. The local `pre-push` hook is the gate. It runs:

```bash
pnpm exec oxfmt
pnpm exec oxlint --fix-suggestions
```

If either command edits a file, the hook prints `oxfmt or oxlint --fix-suggestions changed files. Commit those fixes before pushing.` and exits 1. Commit the edits, then push again. The hook does not run tests or typecheck. Run those yourself.

## Formatter and linter

[oxfmt](https://oxc.rs/docs/guide/usage/formatter) formats the tree. [oxlint](https://oxc.rs/docs/guide/usage/linter) 1.93.0 lints it. Config is `.oxfmtrc.json` and `.oxlintrc.json`. Both ignore `.agents/skills/**`.

[`.editorconfig`](.editorconfig) sets the editor defaults the formatter expects: UTF-8, spaces, indent 2, a final newline, trimmed trailing whitespace. TypeScript uses single quotes. Markdown keeps trailing double spaces, because those are line breaks.

Do not add ESLint or Prettier config for this repo. The sample app and the docs app follow the same root formatter and linter.

## Commit messages

There is no commit-msg hook and no commitlint. Reviewers read the subject line.

Write the subject in the imperative, the way you would finish “this commit will…”. Name the thing that changed. Keep it to about 72 characters. No trailing period.

```text
Add a warning when ngSrc is missing width
Fix changed-scope fallback when git diff is empty
Document the ci install workflow
```

Skip subjects that could describe any commit: `update`, `fixes`, `wip`, `cleanup`.

Add a body when the subject cannot carry the reason. Leave a blank line between the subject and the body. Wrap the body at 72 characters. Use `Fixes #123` when the pull request closes an issue. GitHub closes the issue from that line.

```text
Fix changed-scope fallback when git diff is empty

A clean checkout has no diff against HEAD, so the scan was skipping
the project. Fall back to a full scan in that case.

Fixes #123
```

One commit can hold the whole change. Split commits when a reviewer would want to revert one part without the other.

Do not commit `dist/`, `node_modules/`, or `angular-doctor-report.md`. Those paths are gitignored. Do not commit secrets, `.env` files, or lockfile changes you did not cause. Do not bump `packages/angular-doctor/package.json` or run `pnpm publish:pkg`. Version bumps and npm publishes stay with the maintainer.

## Pull requests

Branch from current `main`. Keep the branch to one change.

GitHub fills the description from [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). Say what changed, why, and which commands you ran.

A docs or layout change needs a note about which pages you opened. A new or changed rule needs the unit test from the section below, and a README table update when the public rule list changes.

This repository has no GitHub Actions check on pull requests. The description is how a reviewer knows `pnpm test` and `pnpm typecheck` passed.

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

When the sample app should show the finding, add a file under `fixtures/sample-app/src/` that still builds:

```bash
pnpm --filter sample-angular-app build
```

Do not add a dependency the fixture does not install.

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

## License

This project is [MIT](LICENSE). A pull request is a contribution under that license, including the copyright line “Copyright (c) 2026 Angular Doctor contributors”.
