import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { Callout } from '../../callout';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Open source' };

@Component({
  selector: 'docs-open-source',
  imports: [DocPage, Callout],
  template: `
    <docs-page
      [title]="'Open source'"
      [lede]="'MIT licensed. The rules live in the scanner, and the docs describe the package you run.'"
    >
      <h2 id="license">License</h2>
      <p>
        Angular Doctor is released under the MIT license. You can use it, change it, and ship it
        with your own tools, as long as the license notice stays with the code.
      </p>

      <h2 id="where-rules-live">Where rules live</h2>
      <p>
        Rules live in the scanner. A new check needs a stable id, a severity, and a short message
        that says what to do next. Docs on this site describe the package a user runs, not the
        layout of the repository.
      </p>

      <h2 id="this-site">This site</h2>
      <p>
        The site is built with Analog and Angular. The source is on
        <a href="https://github.com/abiramcodes/angular-doctor">GitHub</a>, under the MIT license.
        Angie, the Angular mascot, appears on the 404 page.
      </p>

      <h2 id="deploy">Deploy</h2>
      <p>
        The site deploys as static files on Cloudflare Pages. Every route is prerendered, so no
        server is needed.
      </p>
      <ul>
        <li>Build command: <code>pnpm docs:build</code></li>
        <li>Output directory: <code>apps/docs/dist/analog/public</code></li>
        <li>Node version: 20.19 or newer</li>
      </ul>
      <p>
        When a docs page is added under <code>src/app/pages</code>, add its route to the prerender
        list in <code>apps/docs/vite.config.ts</code>, or it will not exist in the static output.
      </p>
      <docs-callout variant="note" label="The mark is not the Angular shield">
        <p>
          The brand mark on this site is a scan trace, not the Angular shield. Angie is used only on
          the 404 page, with the supplied artwork.
        </p>
      </docs-callout>
    </docs-page>
  `,
})
export default class DocsOpenSource {}
