import { Location } from '@angular/common';
import { Component, ViewChild, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DocToc } from './doc-toc';

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'docs-page',
  host: { class: 'shell block' },
  imports: [RouterLink, RouterLinkActive, DocToc],
  template: `
    <div class="docs-grid">
      <aside class="docs-sidebar" aria-label="Docs">
        @for (group of groups; track group.title) {
          <nav class="nav-group">
            <p class="nav-group-title">{{ group.title }}</p>
            @for (item of group.items; track item.href) {
              <a
                class="nav-link"
                [routerLink]="item.href"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              >
                {{ item.label }}
              </a>
            }
          </nav>
        }
      </aside>

      <article class="docs-main">
        <header class="docs-header">
          <h1 class="docs-title">{{ title() }}</h1>
          @if (lede(); as text) {
            <p class="docs-lede">{{ text }}</p>
          }
        </header>

        <ng-content select="docs-quickstart" />

        <div class="doc-prose" docToc>
          <ng-content />
        </div>
      </article>

      <aside class="doc-toc" aria-label="On this page">
        @if (toc; as tocRef) {
          @if (tocRef.items().length) {
            <p class="doc-toc-title">On this page</p>
            @for (item of tocRef.items(); track item.id) {
              <a [attr.href]="tocHref(item.id)">{{ item.label }}</a>
            }
          }
        }
      </aside>
    </div>
  `,
})
export class DocPage {
  private readonly location = inject(Location);

  readonly title = input.required<string>();
  readonly lede = input<string | null>(null);

  @ViewChild(DocToc)
  protected toc?: DocToc;

  protected tocHref(id: string): string {
    const path = this.location.path().split('#')[0] || '/';
    return `${path}#${id}`;
  }

  readonly groups: NavGroup[] = [
    {
      title: 'Get started',
      items: [
        { href: '/docs', label: 'Overview', exact: true },
        { href: '/docs/run', label: 'Run' },
        { href: '/docs/reference', label: 'Reference' },
      ],
    },
    {
      title: 'Output',
      items: [
        { href: '/docs/output', label: 'Output' },
        { href: '/docs/colors', label: 'Colors' },
      ],
    },
    {
      title: 'Automate',
      items: [{ href: '/docs/ci', label: 'CI' }],
    },
    {
      title: 'Project',
      items: [{ href: '/docs/open-source', label: 'Open source' }],
    },
  ];
}
