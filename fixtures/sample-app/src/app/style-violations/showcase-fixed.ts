import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { ShowcaseStore } from './showcase-store';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';

/**
 * Real-world patterns that older versions reported but 0.3.0 accepts.
 * Scanning this file should produce no findings from the changed rules:
 * prefer-document-token, inner-html, ng-model-name, effect-writes-state,
 * target-blank, or the template accessibility replacements. It also uses
 * patterns owned by other tools now (public Firebase key, duplicated
 * template blocks), which stay silent here.
 */

// Public by design: a Firebase web apiKey ships to every browser. Secret
// scanning belongs to a dedicated scanner, not this tool (rule removed).
export const firebaseConfig = {
  apiKey: 'AIzaSyExamplePublicWebKey000000000000',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo',
};

@Component({
  selector: 'app-showcase-fixed',
  imports: [FormsModule, NgOptimizedImage],
  template: `
    <!-- Sanitized by Angular: no bypassSecurityTrust* in this file. -->
    <article [innerHTML]="renderedMarkdown()"></article>

    <!-- Bound [alt] counts as alt text (template-eslint/alt-text). -->
    <img ngSrc="cover.png" width="640" height="360" [alt]="coverLabel()" />

    <!-- ngModel outside a form needs no name; the wrapping label labels it. -->
    <label>
      Search
      <input [(ngModel)]="query" />
    </label>

    <form>
      <label for="draft">Draft</label>
      <!-- Standalone ngModel inside a form needs no name either. -->
      <input id="draft" [(ngModel)]="draft" [ngModelOptions]="{ standalone: true }" />
    </form>

    <!-- Bound [rel] counts as handled. -->
    <a target="_blank" [rel]="externalRel" href="https://angular.dev">Angular docs</a>

    <!-- Duplicated on purpose: duplication is SonarQube's job since 0.3.0. -->
    <section class="card">
      <h3>{{ coverLabel() }}</h3>
      <p>First card body.</p>
    </section>
    <section class="card">
      <h3>{{ coverLabel() }}</h3>
      <p>Second card body.</p>
    </section>
  `,
})
export class ShowcaseFixed {
  protected readonly query = signal('');
  protected readonly draft = signal('');
  protected readonly renderedMarkdown = signal('<p>Rendered markdown.</p>');
  protected readonly coverLabel = signal('Article cover');
  protected readonly externalRel = 'noopener';

  // A binding named `document` shadows the global, so uses below are the
  // injected DOCUMENT token, not the global object.
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly store = inject(ShowcaseStore);

  constructor() {
    effect(() => {
      // Side effects effect() exists for: tab title, DOM dataset, and a
      // signal owned by an injected service. None of these are same-file
      // signal writes, so effect-writes-state stays silent.
      this.title.setTitle(this.coverLabel());
      const document = this.document;
      document.body.dataset['ready'] = 'true';
      this.store.seen.set(true);
    });
  }
}
