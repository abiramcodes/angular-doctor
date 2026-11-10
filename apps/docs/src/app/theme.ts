import { DOCUMENT } from '@angular/common';
import { Injectable, afterNextRender, inject, signal } from '@angular/core';

const STORAGE_KEY = 'angular-doctor-theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<'dark' | 'light'>('dark');

  constructor() {
    afterNextRender(() => {
      if (typeof localStorage === 'undefined') {
        return;
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      this.mode.set(stored === 'light' ? 'light' : 'dark');
      this.apply();
    });
  }

  toggle(): void {
    const next = this.mode() === 'dark' ? 'light' : 'dark';
    this.mode.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next);
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = this.document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };
    if (!reduce && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => this.apply());
    } else {
      this.apply();
    }
  }

  private apply(): void {
    const root = this.document.documentElement;
    const dark = this.mode() === 'dark';
    root.classList.toggle('dark', dark);
    root.style.colorScheme = this.mode();
    const meta = this.document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', dark ? '#0C0B0E' : '#F7F5F1');
    }
  }
}
