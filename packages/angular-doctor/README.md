# Angular Doctor

Deterministic health scan for Angular and Nx workspaces.

```bash
npx @abiramcodes/angular-doctor@latest
npx @abiramcodes/angular-doctor@latest --verbose --scope changed
npx @abiramcodes/angular-doctor@latest rules list
npx @abiramcodes/angular-doctor@latest install
```

Requires Node.js 20.19 or newer. The scan looks for `angular.json` or `nx.json`, prints a 0–100 score, and writes `angular-doctor-report.md` when it finds anything.

Source and issues: https://github.com/abiramcodes/angular-doctor
License: MIT
