import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'docs-not-found',
  imports: [RouterLink],
  template: `
    <div class="shell notfound">
      <div class="nf-grid">
        <div class="nf-copy">
          <h1 class="nf-title">This page is not in the set.</h1>
          <p class="nf-lede">
            The address you asked for is not here. The scan still runs, and the docs still have the
            commands.
          </p>
          <div class="nf-actions">
            <a class="btn btn-solid" routerLink="/">Back to the floor</a>
            <a class="btn btn-outline" routerLink="/docs">Open the docs</a>
          </div>
        </div>
        <figure class="nf-stage">
          <span class="nf-stamp">404 · pattern not found</span>
          <img
            class="nf-angie"
            src="/angie.svg"
            width="520"
            height="520"
            alt="Angie, the Angular mascot, standing on the stage"
          />
          <figcaption class="nf-caption">Angie · off the setlist</figcaption>
        </figure>
      </div>
    </div>
  `,
})
export default class NotFound {
  constructor() {
    inject(Title).setTitle('Page not found — Angular Doctor');
  }
}
