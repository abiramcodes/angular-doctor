import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { CodeBlock } from '../../code-block';
import { Callout } from '../../callout';

const installCommand = 'npx angular-doctor@latest ci install';
const scanCommands = `npx angular-doctor@latest --scope changed --json
npx angular-doctor@latest --score-only`;

@Component({
  selector: 'docs-ci',
  imports: [DocPage, CodeBlock, Callout],
  template: `
    <docs-page
      [title]="'CI'"
      [lede]="'A starter GitHub Actions workflow, and the flags that make a scan useful in a pipeline.'"
    >
      <p>Add the workflow from the project root:</p>
      <docs-code-block [code]="installCommand" label="terminal" lang="bash" />

      <h2 id="pull-requests">Pull requests</h2>
      <p>
        The workflow checks out the repository and runs Angular Doctor. Use
        <code>--scope changed</code> to report files that differ from <code>HEAD</code> in the
        working tree; a clean CI checkout falls back to a full scan. <code>--json</code> prints a
        single object for another job to read.
      </p>
      <p>
        <code>--score-only</code> prints the number and nothing else, which is enough for a status
        check that tracks the score over time.
      </p>
      <docs-code-block [code]="scanCommands" label="terminal" lang="bash" />

      <h2 id="notes">Notes</h2>
      <docs-callout variant="note" label="The workflow file is not overwritten">
        <p>
          <code>ci install</code> writes <code>.github/workflows/angular-doctor.yml</code> only when
          that file is not already there. Edit it freely once it exists.
        </p>
      </docs-callout>
      <docs-callout variant="warning" label="A pipe prints no color">
        <p>
          In CI, stdout is not a terminal, so the summary prints as plain text. Use
          <code>--json</code> when another job needs the result.
        </p>
      </docs-callout>
    </docs-page>
  `,
})
export default class DocsCi {
  protected readonly installCommand = installCommand;
  protected readonly scanCommands = scanCommands;
}
