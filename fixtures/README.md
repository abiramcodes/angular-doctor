# Fixture apps

Small workspaces for manually checking scan behaviour. They are not built or
served; the scanner reads their source only.

## `sample-app` — violations showcase (Angular 22)

Legacy patterns and style violations that should keep firing. The 0.3.0
changes have a dedicated pair in `src/app/style-violations/`:

- `showcase-fixed.ts` — a realistic article reader using every reported
  pattern correctly: public Firebase config, `inject(DOCUMENT)` held in a
  binding named `document`, sanitized `[innerHTML]` markdown, formless and
  standalone `ngModel`, bound `[alt]`/`[rel]`, wrapping `<label>`, the
  tab-title/service-signal effect, and a duplicated card block. **Expect no
  findings from the changed rules** (a couple of unrelated info preferences
  such as prefer-signal-forms are fine).
- `showcase-violations.ts` — the same component done wrong. **Expect**:
  `prefer-document-token`, `inner-html` (direct assignment and
  bypass-fed binding), `security-bypass`, `ng-model-name`,
  `effect-writes-state`, `target-blank`, `template-eslint/alt-text`, and
  `template-eslint/no-positive-tabindex`.

## `clean-app` — zero-false-positive guard (Angular 22)

A minimal correct app (`PostReader` + `ReaderStore`). Scores 100/100; the
only findings are two info-level preferences (NgOptimizedImage, signal
forms). `packages/core/tests/clean-app.test.ts` asserts the changed rules
never fire here.

## `sample-app-v14` / `-v15` / `-v16`

Version-tier fixtures: unsupported (14) and compatibility mode (15–16).

## Commands

From the repo root, after `pnpm build`:

```bash
# Violations showcase, grouped terminal output
node packages/angular-doctor/bin/angular-doctor.js --verbose fixtures/sample-app

# Same, as an HTML report you can open
node packages/angular-doctor/bin/angular-doctor.js --verbose --html fixtures/sample-app

# Only the changed-rule findings, as JSON you can grep
node packages/angular-doctor/bin/angular-doctor.js --json fixtures/sample-app

# The clean app (expect 100/100, 0 errors, 0 warnings)
node packages/angular-doctor/bin/angular-doctor.js --verbose fixtures/clean-app

# The current rule catalog (68 rules)
node packages/angular-doctor/bin/angular-doctor.js rules list
node packages/angular-doctor/bin/angular-doctor.js rules explain angular-doctor/inner-html
```

Tip: to diff before/after behaviour, run a scan, then change one pattern in
a showcase file (for example delete the `name` workarounds) and re-run with
`--scope changed`.
