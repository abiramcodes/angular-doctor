import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { Callout } from '../../callout';

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
        The public site will live at angular.doctor. The domain is not registered yet. The official
        Angular logo and Angie, the Angular mascot, will be added to this site later.
      </p>
      <docs-callout variant="note" label="The Angular logo is not here yet">
        <p>
          The brand mark on this site is a pulse trace, not the Angular shield. Replace it when the
          official artwork is available.
        </p>
      </docs-callout>
    </docs-page>
  `,
})
export default class DocsOpenSource {}
