import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { CopyCommand } from '../../home/copy-command';
import { commandGroups, commandsIntro, flags, templateLintRows } from '../../home/landing-content';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Reference' };

@Component({
  selector: 'docs-reference',
  imports: [DocPage, CopyCommand],
  template: `
    <docs-page
      [title]="'Reference'"
      [lede]="'The commands, the flags they accept, and how the score is calculated.'"
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

      <h2 id="template-lint">Template lint</h2>
      <p>
        Standalone templates and inline component templates run through the Angular template rules.
        Five rules are enabled; the rest are deliberately off because the built-in scanner already
        covers them with class context the linter cannot see.
      </p>
      <table>
        <caption class="sr-only">
          Template lint rules
        </caption>
        <thead>
          <tr>
            <th scope="col">Rule</th>
            <th scope="col">What it catches</th>
          </tr>
        </thead>
        <tbody>
          @for (row of templateLintRows; track row.name) {
            <tr>
              <th scope="row">
                <code>{{ row.name }}</code>
              </th>
              <td>{{ row.detail }}</td>
            </tr>
          }
        </tbody>
      </table>
      <p>
        The <code>angular-doctor/defer-missing-trigger</code> check covers &#64;defer blocks without
        an on, when, or prefetch trigger. See the Rules page for details.
      </p>

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
    </docs-page>
  `,
})
export default class DocsReference {
  protected readonly commandGroups = commandGroups;
  protected readonly commandsIntro = commandsIntro;
  protected readonly flags = flags;
  protected readonly templateLintRows = templateLintRows;

  protected slug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
}
