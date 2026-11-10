import {
  buildSchematicWithPath,
  getMigrationById,
  getMigrationForRule,
  getRecommendedMigrations,
  MIGRATIONS_HUB,
  migrationAvailable,
  relativeDirFromProject,
} from '../migrations/registry.js';
import {
  getStyleGuideUrl,
  RULE_CATALOG_VERSION,
  STYLE_GUIDE_URL,
} from '../rules/style-guide-catalog.js';
import type { Diagnostic, ProjectInfo, ScanResult } from '../types.js';

function groupByCategory(diagnostics: Diagnostic[]): Map<string, Diagnostic[]> {
  const map = new Map<string, Diagnostic[]>();
  for (const d of diagnostics) {
    const list = map.get(d.category) ?? [];
    list.push(d);
    map.set(d.category, list);
  }
  return map;
}

function migrationBlock(
  d: Diagnostic,
  projectRoot: string,
  angularVersion: string | null,
): string[] {
  const entry =
    (d.migrationId ? getMigrationById(d.migrationId) : undefined) ?? getMigrationForRule(d.ruleId);
  if (!entry || !migrationAvailable(entry, angularVersion)) {
    return d.docsUrl ? [`- **Reference:** ${d.docsUrl}`] : [];
  }
  const relPath = relativeDirFromProject(d.file, projectRoot);
  const cmd = buildSchematicWithPath(entry.schematic, relPath);
  const lines = [
    `- **Migration docs:** ${entry.docsUrl}`,
    `- **Automated fix (dry-run first):**`,
    '',
    '```bash',
    `${cmd} --dry-run`,
    `${cmd}`,
    '```',
  ];
  const styleUrl = getStyleGuideUrl(d.ruleId);
  if (styleUrl && styleUrl !== entry?.docsUrl) {
    lines.push(`- **Style guide:** ${styleUrl}`);
  }
  if (d.docsUrl && d.docsUrl !== entry?.docsUrl && d.docsUrl !== styleUrl) {
    lines.push(`- **Also see:** ${d.docsUrl}`);
  }
  return lines;
}

export function buildMarkdownReport(
  result: Omit<ScanResult, 'reportPath'>,
  project: ProjectInfo,
): string {
  const grouped = groupByCategory(result.diagnostics);
  const recommended = getRecommendedMigrations(
    result.diagnostics,
    project.root,
    project.angularVersion,
  );

  const lines: string[] = [
    '# Angular Doctor report',
    '',
    '> Self-contained findings for coding agents. Re-run `npx angular-doctor@latest --verbose` after fixes.',
    '',
    '## Summary',
    '',
    `- **Health score:** ${result.score}/100`,
    `- **Errors:** ${result.totals.error}`,
    `- **Warnings:** ${result.totals.warning}`,
    `- **Infos:** ${result.totals.info}`,
    `- **Project:** ${project.name} (${project.kind})`,
    `- **Angular:** ${project.angularVersion ?? 'unknown'}`,
    `- **Scan duration:** ${result.durationMs}ms`,
    '',
    '## Official Angular migrations',
    '',
    `Hub: [angular.dev/reference/migrations](${MIGRATIONS_HUB})`,
    '',
    'Prefer official `ng generate @angular/core:*` schematics over hand edits when this report links one.',
    'Use `--dry-run` first, then apply with `--path` for incremental modernization.',
    'Run `ng build` and tests between multi-step migrations (especially standalone).',
    '',
  ];

  if (recommended.length > 0) {
    lines.push('## Recommended migration commands', '');
    lines.push(
      'Commands deduplicated from this scan, in a sensible order. Scope with the `--path` shown or your project root.',
      '',
    );
    for (const m of recommended) {
      lines.push(`### ${m.title}`, '');
      lines.push(`- **Docs:** ${m.docsUrl}`);
      lines.push('- **Command:**');
      lines.push('');
      lines.push('```bash');
      lines.push(`${m.command} --dry-run`);
      lines.push(m.command);
      lines.push('```');
      lines.push('');
    }
  }

  if (result.skippedChecks.length > 0) {
    lines.push('### Skipped checks', '');
    for (const skip of result.skippedChecks) {
      lines.push(`- ${skip}`);
    }
    lines.push('');
  }

  lines.push(
    '## How to fix',
    '',
    `**Style guide:** [angular.dev/style-guide](${STYLE_GUIDE_URL})`,
    '',
    '1. Run applicable migrations from the hub and the **Recommended migration commands** section.',
    '2. Fix style guide findings using the linked section per rule (naming, structure, components, templates).',
    '3. Read grouped findings below for anything migrations do not cover.',
    '4. Align with the `angular-developer` skill.',
    '5. Re-scan with `npx angular-doctor@latest --verbose --scope changed`.',
    '',
  );

  for (const [category, items] of grouped) {
    lines.push(`## ${category}`, '');
    for (const d of items) {
      lines.push(`### ${d.ruleId} (${d.severity})`, '');
      lines.push(`- **Location:** \`${d.file}:${d.line}:${d.column}\``);
      lines.push(`- **Message:** ${d.message}`);
      if (d.suggestion) {
        lines.push(`- **Suggested fix:** ${d.suggestion}`);
      }
      lines.push(...migrationBlock(d, project.root, project.angularVersion));
      lines.push('');
    }
  }

  lines.push(
    '---',
    '',
    '```json',
    JSON.stringify(
      {
        score: result.score,
        totals: result.totals,
        migrationsHub: MIGRATIONS_HUB,
        styleGuideUrl: STYLE_GUIDE_URL,
        ruleCatalogVersion: RULE_CATALOG_VERSION,
        recommendedCommands: recommended.map((m) => m.command),
      },
      null,
      2,
    ),
    '```',
    '',
  );
  return lines.join('\n');
}
