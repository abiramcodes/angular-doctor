# Angular Doctor triage

1. Run `npx angular-doctor@latest --verbose --scope changed` from the repo root.
2. If `angular-doctor-report.md` exists, treat it as the source of truth for findings.
3. Run **Recommended migration commands** from the report, then address [style guide](https://angular.dev/style-guide) findings (naming/structure are warning or info only).
4. Fix errors before warnings; security and accessibility before style.
5. If the `angular-developer` skill is installed, cross-check the fix against it. The scan report is enough when that skill is not installed.
6. Re-run the scan and confirm the score did not regress.
7. Leave commits to the user unless they explicitly request a commit message.
