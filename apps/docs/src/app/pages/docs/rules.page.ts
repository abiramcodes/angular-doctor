import { Component, computed, signal } from '@angular/core';
import { DocPage } from '../../doc-page';
import { ruleCatalog, ruleCategories } from '../../home/rules-content';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Rules' };

type SeverityFilter = 'all' | 'error' | 'warning' | 'info';

const FILTERS: { value: SeverityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
  { value: 'info', label: 'Info' },
];

@Component({
  selector: 'docs-rules',
  imports: [DocPage],
  template: `
    <docs-page
      [title]="'Rules'"
      [lede]="'Every built-in check with its default severity and what it looks for. Generated from the rule registry, so this page always matches the CLI.'"
      [tocItems]="tocItems()"
    >
      <p>
        Severities are strict by default: correctness, security, and accessibility warnings count as
        errors. Soften or silence a rule in <code>angular-doctor.config.json</code> under
        <code>rules</code>. Run <code>angular-doctor rules explain &lt;id&gt;</code> in your
        terminal for the same details.
      </p>

      <div class="palette-switch rule-filter" role="group" aria-label="Filter rules by severity">
        @for (option of filters; track option.value) {
          <button
            type="button"
            class="palette-switch-btn"
            [class.is-active]="severityFilter() === option.value"
            [attr.aria-pressed]="severityFilter() === option.value"
            (click)="severityFilter.set(option.value)"
          >
            {{ option.label }} ({{ countFor(option.value) }})
          </button>
        }
      </div>

      @if (visibleCount() === 0) {
        <p>No rules match this severity.</p>
      }

      @for (group of visibleCategories(); track group.category) {
        <h2 [id]="group.category">
          {{ group.category }} <span class="rule-cat-count">({{ group.rules.length }})</span>
        </h2>
        @for (rule of group.rules; track rule.id) {
          <h3 [id]="rule.slug">
            <code>{{ rule.id }}</code>
          </h3>
          <p>
            <strong>{{ rule.title }}</strong> · default severity
            <span class="rule-sev rule-sev-{{ rule.severity }}">
              <span class="rule-sev-dot" aria-hidden="true"></span>{{ rule.severity }}
            </span>
            @if (rule.minAngular; as minAngular) {
              · Angular ≥{{ minAngular }}
            }
          </p>
          <p>{{ rule.summary }}</p>
          @if (rule.docsUrl; as docsUrl) {
            <p><a [href]="docsUrl" rel="noreferrer">Reference</a></p>
          }
        }
      }
    </docs-page>
  `,
})
export default class DocsRules {
  protected readonly filters = FILTERS;
  protected readonly severityFilter = signal<SeverityFilter>('all');

  protected readonly visibleCategories = computed(() => {
    const filter = this.severityFilter();
    return ruleCategories
      .map((category) => ({
        category,
        rules: ruleCatalog.filter(
          (rule) => rule.category === category && (filter === 'all' || rule.severity === filter),
        ),
      }))
      .filter((group) => group.rules.length > 0);
  });

  protected readonly visibleCount = computed(() =>
    this.visibleCategories().reduce((sum, group) => sum + group.rules.length, 0),
  );

  /** TOC follows the filter: only visible categories are listed. */
  protected readonly tocItems = computed(() =>
    this.visibleCategories().map((group) => ({
      id: group.category,
      label: `${group.category} (${group.rules.length})`,
    })),
  );

  protected countFor(filter: SeverityFilter): number {
    return filter === 'all'
      ? ruleCatalog.length
      : ruleCatalog.filter((rule) => rule.severity === filter).length;
  }
}
