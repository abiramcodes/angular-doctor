import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ReaderStore } from './reader-store';

@Component({
  selector: 'app-post-reader',
  imports: [FormsModule],
  template: `
    <article [innerHTML]="renderedMarkdown()"></article>
    <img [alt]="coverLabel()" src="cover.png" />
    <label>
      Search
      <input [(ngModel)]="query" />
    </label>
    <form>
      <label for="draft">Draft</label>
      <input id="draft" [(ngModel)]="draft" [ngModelOptions]="{ standalone: true }" />
    </form>
    <a target="_blank" [rel]="externalRel" href="https://angular.dev">Angular docs</a>
  `,
})
export class PostReader {
  protected readonly query = signal('');
  protected readonly draft = signal('');
  protected readonly renderedMarkdown = signal('<p>Hello</p>');
  protected readonly coverLabel = signal('Post cover');
  protected readonly externalRel = 'noopener';

  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly store = inject(ReaderStore);

  constructor() {
    // document here is the injected DOCUMENT token, not the global.
    effect(() => {
      this.title.setTitle(this.coverLabel());
      this.document.body.dataset['ready'] = 'true';
      this.store.seen.set(true);
    });
  }
}
