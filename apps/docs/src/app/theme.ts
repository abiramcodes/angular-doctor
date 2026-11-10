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
    this.apply();
  }

  private apply(): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', this.mode() === 'dark');
    root.style.colorScheme = this.mode();
  }
}
