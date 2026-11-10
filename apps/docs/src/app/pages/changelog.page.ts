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
              <h2 class="changelog-version">0.1.2</h2>
              <p class="changelog-status">Current package</p>
              <ul>
                <li>
                  An error costs 1.5 in each file. A warning still costs 0.75 once per rule. Notes
                  still do not change the score.
                </li>
                <li>Oxlint findings keep their rule id and the line they were found on.</li>
                <li>
                  The landing headline is "Check Angular code." Angular sits on the lamp-red block.
                </li>
                <li>The docs pointer is a scan reticle. Clicks land on the red square.</li>
                <li>Overview commands place the copy control at the right edge of the command.</li>
              </ul>
            </div>
          </li>
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.1.1</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>Scan .ts and .html only. .js, .mjs, .cjs, and .tsx are no longer read.</li>
                <li>
                  A check that cannot finish on a file is skipped. The summary names that file, and
                  the rest of the scan still runs.
                </li>
                <li>
                  Import text copied from a file is treated as an identifier, so a string that looks
                  like an import no longer stops the run.
                </li>
              </ul>
            </div>
          </li>
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
