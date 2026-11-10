import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { CopyCommand } from '../../home/copy-command';
import { Callout } from '../../callout';
import { commandGroups, commandsIntro, flags } from '../../home/landing-content';

@Component({
  selector: 'docs-reference',
  imports: [DocPage, CopyCommand, Callout],
  template: `
    <docs-page
      [title]="'Reference'"
      [lede]="'The published commands, the flags they accept, and how the score is calculated.'"
    >
      <p>{{ commandsIntro }}</p>

      @for (group of commandGroups; track group.title) {
        <h2 [id]="slug(group.title)">{{ group.title }}</h2>
        <ul class="command-list">
          @for (row of group.rows; track row.command) {
            <li class="command-row">
              <div class="command-row-main">
                <code class="command-row-code">{{ row.command }}</code>
                <p class="command-row-detail">{{ row.detail }}</p>
              </div>
              <docs-copy-command tone="quiet" [value]="row.command" />
            </li>
          }
        </ul>
      }

      <h2 id="flags">Flags</h2>
      <table>
        <caption class="sr-only">
          Scan and install flags
        </caption>
        <thead>
          <tr>
            <th scope="col">Flag</th>
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          @for (flag of flags; track flag.flag) {
            <tr>
              <th scope="row">
                <code>{{ flag.flag }}</code>
              </th>
              <td>{{ flag.detail }}</td>
            </tr>
          }
        </tbody>
      </table>

      <h2 id="score">Score</h2>
      <p>
        Start at 100. Subtract 1.5 for each error rule and 0.75 for each warning rule. A note costs
        nothing. Each rule counts once, at its strongest severity.
      </p>
      <docs-callout variant="tip" label="Repeating a rule does not cost more">
        <p>
          The same rule in ten files costs the same as in one file. The score never goes below 0.
        </p>
      </docs-callout>
    </docs-page>
  `,
})
export default class DocsReference {
  protected readonly commandGroups = commandGroups;
  protected readonly commandsIntro = commandsIntro;
  protected readonly flags = flags;

  protected slug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
