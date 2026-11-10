import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { Quickstart, type QuickstartStep } from '../../quickstart';
import { steps, whatItIs } from '../../home/landing-content';

const quickstartSteps: QuickstartStep[] = [
  {
    title: 'Run the scan',
    body: 'One command in your project root once the package is published. No install, no config.',
    command: 'npx @abiramcodes/angular-doctor@latest',
  },
  {
    title: 'Read the score',
    body: 'A 0–100 score, a health meter, and findings grouped by severity.',
    command: 'npx @abiramcodes/angular-doctor@latest --verbose',
  },
  {
    title: 'Fix what changed',
    body: 'Re-scan after edits. The report lists each finding with a suggested fix when the rule has one.',
    command: 'npx @abiramcodes/angular-doctor@latest --scope changed',
  },
];

@Component({
  selector: 'docs-overview',
  imports: [DocPage, Quickstart],
  template: `
    <docs-page
      [title]="'Overview'"
      [lede]="'A command-line health scan for Angular CLI and Nx workspaces. It reads your source, scores it from 0 to 100, and writes a report you can fix from.'"
    >
      <docs-quickstart [steps]="quickstartSteps" />
      <h2 id="what-it-is">What it is</h2>
      @for (paragraph of whatItIs; track paragraph) {
        <p>{{ paragraph }}</p>
      }
      <h2 id="how-it-works">How it works</h2>
      <ol class="list-decimal space-y-4 pl-5">
        @for (step of steps; track step.title) {
          <li>
            <h3 class="font-semibold">{{ step.title }}</h3>
            <p>{{ step.body }}</p>
          </li>
        }
      </ol>
    </docs-page>
  `,
})
export default class DocsOverview {
  protected readonly whatItIs = whatItIs;
  protected readonly steps = steps;
  protected readonly quickstartSteps = quickstartSteps;
}
