# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed audiences, neither subordinate to the other. Angular tech leads and teams set code standards and gate pull requests or CI, and need a check they can trust across a whole codebase. Angular developers working with AI coding agents need a fast, deterministic check to run after an agent edits code, plus a report an agent can act on without further interpretation. Both arrive already running an Angular CLI or Nx workspace and an existing lint setup.

## Product Purpose

The public site for Angular Doctor, an open-source command-line health scan for Angular CLI and Nx workspaces. The CLI reads source, prints a 0–100 score with findings grouped by severity, and writes `angular-doctor-report.md` when anything is found. The site exists to make the product legible and to get a developer from arrival to a first successful scan quickly; its success measure is command run rate, not time on page or docs depth.

## Positioning

The differentiator is the combination, not any one part: a zero-config, deterministic scan that finishes in roughly 300 ms, Angular-specific rules that general linters and template ESLint do not cover, and a Markdown report written for an agent to act on. The scan is complementary to a project's existing lint, tests, and build — never a replacement. Copy must not split this bundle into a claim stronger than the others, e.g. presenting speed without the Angular-specific coverage, or presenting the report as something the scan does not actually produce.

## Operating Context

A developer runs the command from an Angular workspace root (the scan walks up to 12 parents looking for `angular.json` or `nx.json`). Workspaces are Angular CLI or Nx; the reference sample is Angular 22.2. Findings are read in a terminal and in the generated Markdown report; the same report is fed to a coding agent after edits. CI is GitHub Actions, installed by the CLI. CLI color palettes (`default`, `pastel`, `velvet`) are a terminal feature of the product, distinct from the site's own theme and accent controls.

## Capabilities and Constraints

Confirmed product surface: 76 built-in checks across six categories (correctness, performance, maintainability, security, accessibility, hygiene); scoring where each rule counts once at its strongest severity, an error costing 1.5 points, a warning 0.75, and a note nothing; scope modes full, changed, files, and contextual; `--verbose`, `--category`, `--json`, `--colors`, `--scope`; `rules list`, `rules explain`, migrations, `ci install`, and agent skill `install`. The site covers a landing page, docs (overview, run, reference, output, colors, CI, open source), and a changelog.

Durable constraints:

- Every factual claim on the site — counts, timings, rule names, sample output, severity behavior — must be reproducible from the repository's real CLI output. No invented benchmarks, testimonials, customer stories, or adoption numbers.
- npm publication is **not confirmed** as of this record. The README says "published usage (once released)" while site copy already presents `npx angular-doctor@latest` as live. Site copy implying a stable published release is an open decision, not a settled fact.
- The product is MIT-licensed open source; do not imply pricing, hosted accounts, or a paid tier.
- Do not position it as replacing builds, tests, or the user's current lint setup.

## Brand Commitments

Name: Angular Doctor. Footer states MIT license. Angie, the Angular mascot, ships as supplied artwork on the 404 page only, with provenance recorded at `public/angie.provenance.md`; do not reuse the mascot as a logo or across other surfaces. No other logo, voice, or brand asset beyond the scan-trace brand mark is confirmed.

## Evidence on Hand

- `packages/core` — diagnostic engine, scoring, Markdown reports.
- `packages/angular-doctor` — CLI binary and command surface.
- `fixtures/sample-app` — Angular 22 sample workspace the site's sample output and timings are drawn from; the site's "299 ms / 76 checks" sample is presented as a real scan of this fixture.
- `skills/angular-doctor` — agent skill and triage playbook.
- `public/angie.svg` — supplied Angie artwork, used only on the 404 page.
- Root `README.md` — the rule tables and flag reference the site's docs mirror.

Absences future work must not fill in: no testimonials, customer logos, press coverage, benchmarks against named competitors, or published-package confirmation. Angie artwork exists only as the supplied 404 asset; do not invent additional poses or mascot variants.

## Product Principles

1. Reproducible truth over marketing: if the repo cannot show it, the site does not claim it.
2. One command to first value: the shortest path from landing to a score on the visitor's own workspace.
3. The report is the deliverable, for humans and agents equally.
4. Complementary by design: sit beside existing lint, tests, and CI rather than competing with them.
5. Angular-specific and opinionated: map findings to the Angular style guide and official migrations.

## Accessibility & Inclusion

The repository's engineering standard requires AXE-clean output and WCAG AA minimums, including focus management, color contrast, and ARIA attributes. No additional product-specific user need was confirmed.
