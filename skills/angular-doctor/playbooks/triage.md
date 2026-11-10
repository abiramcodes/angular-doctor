# Angular Doctor triage

1. Run `npx @abiramcodes/angular-doctor@latest --verbose --scope changed` from the repo root.
2. If `angular-doctor-report.md` exists, treat it as the source of truth for findings.
3. Run **Recommended migration commands** from the report (or `npx @abiramcodes/angular-doctor@latest migrations`) using `ng generate @angular/core:*` with `--dry-run`, then apply. See [angular.dev/reference/migrations](https://angular.dev/reference/migrations).
4. Address [style guide](https://angular.dev/style-guide) findings (naming/structure are warning or info only).
5. Fix errors before warnings; security and accessibility before style.
6. If the `angular-developer` skill is installed, cross-check the fix against it. The scan report is enough when that skill is not installed.
7. Re-run the scan and confirm the score did not regress.
8. Leave commits to the user unless they explicitly request a commit message.
