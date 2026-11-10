#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { colorize, parseColorMode, setColorMode } from './commands/palette.js';
import { runInstall, runCiInstall } from './commands/install.js';
import { runMigrationsCommand } from './commands/migrations.js';
import { categoryFromCommand, runRulesExplain, runRulesList } from './commands/rules.js';
import { runScanCommand } from './commands/scan.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

const program = new Command();

program
  .name('angular-doctor')
  .description('Scan Angular projects for health, performance, and agent-ready diagnostics.')
  .version(packageJson.version)
  .option('--colors <mode>', 'Color palette: default, pastel, or velvet', 'default');

program.hook('preAction', (thisCommand) => {
  const raw = String(thisCommand.optsWithGlobals().colors ?? 'default');
  setColorMode(parseColorMode(raw));
});

program
  .option('--json', 'Print JSON scan result')
  .option('--verbose', 'Print file:line diagnostics to stdout')
  .option('--score-only', 'Print only the numeric health score')
  .option('--scope <scope>', 'Scan scope: full | changed | files | contextual', 'full')
  .option(
    '--category <category>',
    'Show findings from one category. The score stays the full scan.',
  )
  .option('--files <paths...>', 'Files for --scope files or contextual seeds')
  .argument('[path]', 'Project directory', process.cwd())
  .action(async (path, opts) => {
    await runScanCommand({
      cwd: path,
      json: Boolean(opts.json),
      verbose: Boolean(opts.verbose),
      scoreOnly: Boolean(opts.scoreOnly),
      scope: opts.scope,
      category: opts.category as string | undefined,
      files: opts.files as string[] | undefined,
    });
  });

const rules = program.command('rules').description('Inspect built-in rules');
rules
  .command('list')
  .description('List rules grouped by category')
  .option('--category <category>', 'Show one category')
  .action((opts: { category?: string }, command) => {
    runRulesList(categoryFromCommand(opts, command));
  });
rules
  .command('explain')
  .description('Explain one rule')
  .argument('<id>', 'Rule id')
  .action((id: string) => {
    runRulesExplain(id);
  });

program
  .command('migrations')
  .description('Print recommended ng generate @angular/core migrations from scan findings')
  .option('--scope <scope>', 'Scan scope: full | changed | files | contextual', 'full')
  .option('--files <paths...>', 'Files for --scope files or contextual seeds')
  .argument('[path]', 'Project directory', process.cwd())
  .action(async (path, opts) => {
    await runMigrationsCommand({
      cwd: path,
      scope: opts.scope,
      files: opts.files as string[] | undefined,
    });
  });

program
  .command('install')
  .description('Install the Angular Doctor agent skill for supported coding agents')
  .option('--force', 'Overwrite an existing skill install')
  .action(async (opts) => {
    await runInstall({ cwd: process.cwd(), force: Boolean(opts.force) });
  });

const ci = program.command('ci').description('CI helpers');
ci.command('install')
  .description('Install CI workflow snippets for Angular Doctor')
  .action(async () => {
    await runCiInstall({ cwd: process.cwd() });
  });

program.hook('postAction', (_, actionCommand) => {
  if (actionCommand.name() === 'angular-doctor' && actionCommand.args.length === 0) {
    // noop
  }
});

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(colorize(`angular-doctor: ${message}`, 'error'));
  process.exitCode = 1;
});
