import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { BrandMark } from './brand';
import { Theme } from './theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, BrandMark],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  template: `
    <div class="ambient" aria-hidden="true">
      <span class="glow glow-a"></span>
    </div>

    <div class="app-shell flex min-h-screen flex-col">
      <a
        class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        [attr.href]="skipHref"
      >
        Skip to content
      </a>

      <header class="site-header">
        <div class="shell site-header-inner">
          <a routerLink="/" class="brand">
            <docs-brand-mark [size]="26" />
            <span>Angular Doctor</span>
          </a>

          <nav class="site-nav" aria-label="Site">
            <a routerLink="/docs" routerLinkActive="is-active">Docs</a>
            <a routerLink="/changelog" routerLinkActive="is-active">Changelog</a>
          </nav>

          <div class="site-header-aside">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              [attr.aria-label]="
                theme.mode() === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'
              "
              (click)="theme.toggle()"
            >
              <ng-icon
                [name]="theme.mode() === 'dark' ? 'lucideSun' : 'lucideMoon'"
                size="16"
                aria-hidden="true"
              />
              <span>{{ theme.mode() === 'dark' ? 'Light' : 'Dark' }}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="content" class="flex-1">
        <router-outlet />
      </main>

      <footer class="site-footer">
        <div class="shell site-footer-inner">
          <span class="site-footer-brand">
            <docs-brand-mark [size]="18" />
            Angular Doctor
          </span>
          <p class="site-footer-meta">MIT license</p>
        </div>
      </footer>
    </div>
  `,
})
export class App {
  readonly theme = inject(Theme);
  private readonly location = inject(Location);

  protected get skipHref(): string {
    return `${this.location.path().split('#')[0] || '/'}#content`;
  }
}
