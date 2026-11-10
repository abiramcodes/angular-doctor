import { runScan } from '@angular-doctor/core/scan/run-scan';
import type { ScanScope } from '@angular-doctor/core/types';
import { parseCategory } from './categories.js';
import {
  createScanView,
  formatReportLine,
  formatScoreSummary,
  formatSkippedChecks,
  printGroupedFindings,
} from './scan-progress.js';

export interface ScanCommandOptions {
  cwd: string;
  json: boolean;
  verbose: boolean;
  scoreOnly: boolean;
  scope: string;
  category?: string;
  files?: string[];
}

const SCOPES: ScanScope[] = ['full', 'changed', 'files', 'contextual'];

function parseScope(raw: string): ScanScope {
  if (SCOPES.includes(raw as ScanScope)) {
    return raw as ScanScope;
  }
  throw new Error(`Invalid --scope "${raw}". Use full, changed, files, or contextual.`);
}

export async function runScanCommand(options: ScanCommandOptions): Promise<void> {
  const scope = parseScope(options.scope);
  const category = options.category ? parseCategory(options.category) : undefined;
  const quiet = options.json || options.scoreOnly;
  const view = quiet ? null : createScanView(options.cwd);
  const result = await runScan({
    cwd: options.cwd,
    scope,
    files: options.files,
    verbose: options.verbose,
    onProgress: (progress) => view?.update(progress),
  });
  await view?.finish(result);

  const diagnostics = category
    ? result.diagnostics.filter((item) => item.category === category)
    : result.diagnostics;

  if (options.scoreOnly) {
    console.log(result.score);
    return;
  }

  if (options.json) {
    console.log(JSON.stringify({ ...result, diagnostics }, null, 2));
    return;
  }

  console.log(formatScoreSummary(result));

  const skipped = formatSkippedChecks(result.skippedChecks, options.cwd);
  if (skipped) {
    console.log(`\n${skipped}`);
  }

  printGroupedFindings(diagnostics, options.cwd);

  if (result.reportPath) {
    console.log(`\n${formatReportLine(result.reportPath)}`);
  }
}
