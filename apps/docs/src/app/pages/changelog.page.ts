import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'docs-changelog',
  template: `
    <div class="shell">
      <article class="changelog">
        <header class="docs-header">
          <h1 class="docs-title">Changelog</h1>
          <p class="docs-lede">What shipped, and what changed.</p>
        </header>
        <ol class="changelog-list">
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.1.0</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>Scan an Angular or Nx project and print a 0–100 health score.</li>
                <li>Group findings into errors, warnings, and notes.</li>
                <li>Write an agent-ready Markdown report when the scan is not clean.</li>
                <li>List and explain rules, and recommend official Angular migrations.</li>
                <li>Install a starter GitHub Actions workflow.</li>
              </ul>
            </div>
          </li>
        </ol>
      </article>
    </div>
  `,
})
export default class Changelog {
  constructor() {
    inject(Title).setTitle('Changelog — Angular Doctor');
  }
}
