import { DOCUMENT, Location } from '@angular/common';
import { afterNextRender, Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';
import { BrandMark } from './brand';
import { Theme } from './theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, BrandMark],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  template: `
    <div class="app-shell flex min-h-screen flex-col">
      <a
        class="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        [attr.href]="skipHref"
      >
        Skip to content
      </a>

      <header class="site-header">
        <div class="shell site-header-inner">
          <a routerLink="/" class="brand" translate="no">
            <docs-brand-mark [size]="26" />
            <span>Angular Doctor</span>
          </a>

          <nav class="site-nav" aria-label="Site">
            <a routerLink="/docs" routerLinkActive="is-active" ariaCurrentWhenActive="location"
              >Docs</a
            >
            <a routerLink="/changelog" routerLinkActive="is-active" ariaCurrentWhenActive="page"
              >Changelog</a
            >
          </nav>

          <div class="site-header-aside">
            <span class="header-state" aria-hidden="true"><i></i>v0.1.2</span>
            <a
              class="header-github"
              href="https://github.com/abiramcodes/angular-doctor"
              target="_blank"
              aria-label="Angular Doctor on GitHub"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
                />
              </svg>
            </a>
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
          <span class="site-footer-brand" translate="no">
            <docs-brand-mark [size]="18" />
            Angular Doctor
          </span>
          <p class="site-footer-meta">
            <a href="https://github.com/abiramcodes/angular-doctor">MIT license · open source</a>
          </p>
          <p class="site-footer-meta">No build · no tests · no config</p>
        </div>
      </footer>
      <div class="scroll-fade scroll-fade--top" aria-hidden="true"></div>
      <div class="scroll-fade scroll-fade--bottom" aria-hidden="true"></div>
    </div>
  `,
})
export class App {
  readonly theme = inject(Theme);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const mark = (): void => {
        for (const node of this.document.querySelectorAll(
          'code, pre, .brand, .site-footer-brand',
        )) {
          node.setAttribute('translate', 'no');
        }
      };
      mark();
      const updateScrollFades = (): void => {
        const root = this.document.documentElement;
        const y = window.scrollY;
        const remaining = root.scrollHeight - y - window.innerHeight;
        root.classList.toggle('is-scrolled', y > 12);
        root.classList.toggle('can-scroll', remaining > 12);
        const header = this.document.querySelector('.site-header');
        if (header) {
          root.style.setProperty('--chrome-bottom', `${header.getBoundingClientRect().bottom}px`);
        }
      };
      const sub = this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          mark();
          updateScrollFades();
        });
      updateScrollFades();
      window.addEventListener('scroll', updateScrollFades, { passive: true });
      window.addEventListener('resize', updateScrollFades);
      this.destroyRef.onDestroy(() => {
        sub.unsubscribe();
        window.removeEventListener('scroll', updateScrollFades);
        window.removeEventListener('resize', updateScrollFades);
      });
    });
  }

  protected get skipHref(): string {
    return `${this.location.path().split('#')[0] || '/'}#content`;
  }
}
