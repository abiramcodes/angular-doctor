import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { CodeBlock } from '../../code-block';
import { Callout } from '../../callout';
import { configExample, configNote, requirements } from '../../home/landing-content';

@Component({
  selector: 'docs-run',
  imports: [DocPage, CodeBlock, Callout],
  template: `
    <docs-page
      [title]="'Run'"
      [lede]="'What you need, the scopes you can scan, and the two config files that change behaviour.'"
    >
      <h2 id="requirements">What you need</h2>
      <table>
        <caption class="sr-only">
          What you need to run Angular Doctor
        </caption>
        <thead>
          <tr>
            <th scope="col">Need</th>
            <th scope="col">Detail</th>
          </tr>
        </thead>
        <tbody>
          @for (row of requirements; track row.need) {
            <tr>
              <th scope="row">{{ row.need }}</th>
              <td>{{ row.detail }}</td>
            </tr>
          }
        </tbody>
      </table>

      <h2 id="configuration">Configuration</h2>
      <p>{{ configNote }}</p>
      <docs-callout variant="note" label="Two config sources">
        <p>
          Put the JSON in <code>angular-doctor.config.json</code>, or under the
          <code>angularDoctor</code> key in <code>package.json</code>. When both set the same field,
          <code>package.json</code> wins.
        </p>
      </docs-callout>
      <docs-code-block [code]="configExample" label="angular-doctor.config.json" lang="json" />
    </docs-page>
  `,
})
export default class DocsRun {
  protected readonly requirements = requirements;
  protected readonly configNote = configNote;
  protected readonly configExample = configExample;
}
