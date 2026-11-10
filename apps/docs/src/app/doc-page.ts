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
          <p class="docs-breadcrumb">docs / {{ title().toLowerCase() }}</p>
          <h1 class="docs-title">{{ title() }}</h1>
          @if (lede(); as text) {
            <p class="docs-lede">{{ text }}</p>
          }
        </header>

        <ng-content select="docs-quickstart" />

        <div class="doc-prose" docToc>
          <ng-content />
        </div>

        <nav class="docs-pager" aria-label="Docs pages">
          @if (prevLink; as prev) {
            <a class="pager-link" [routerLink]="prev.href">
              <span class="pager-dir">Previous</span>
              <span class="pager-label">{{ prev.label }}</span>
            </a>
          } @else {
            <span></span>
          }
          @if (nextLink; as next) {
            <a class="pager-link pager-next" [routerLink]="next.href">
              <span class="pager-dir">Next</span>
              <span class="pager-label">{{ next.label }}</span>
            </a>
          }
        </nav>
      </article>

      <aside class="doc-toc" aria-label="On this page">
        @if (toc; as tocRef) {
          @if (tocRef.items().length) {
            <p class="doc-toc-title">On this page</p>
            @for (item of tocRef.items(); track item.id) {
              <a
                [attr.href]="tocHref(item.id)"
                [class.is-active]="tocRef.active() === item.id"
                [attr.aria-current]="tocRef.active() === item.id ? 'location' : null"
              >
                {{ item.label }}
              </a>
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

  private get flatItems(): NavItem[] {
    return this.groups.flatMap((group) => group.items);
  }

  private get currentIndex(): number {
    const path = (this.location.path().split('#')[0] || '/').replace(/\/$/, '') || '/';
    return this.flatItems.findIndex((item) => item.href === path);
  }

  protected get prevLink(): NavItem | null {
    const index = this.currentIndex;
    return index > 0 ? this.flatItems[index - 1] : null;
  }

  protected get nextLink(): NavItem | null {
    const index = this.currentIndex;
    return index >= 0 && index < this.flatItems.length - 1 ? this.flatItems[index + 1] : null;
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
