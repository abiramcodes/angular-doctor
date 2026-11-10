import { Component, input } from '@angular/core';
import { CopyCommand } from './home/copy-command';

export interface QuickstartStep {
  title: string;
  body: string;
  command: string;
}

@Component({
  selector: 'docs-quickstart',
  host: { class: 'block' },
  imports: [CopyCommand],
  template: `
    <ol class="quickstart">
      @for (step of steps(); track step.title) {
        <li class="quickstart-step">
          <span class="quickstart-index">{{ $index + 1 }}</span>
          <div class="quickstart-main">
            <p class="quickstart-title">{{ step.title }}</p>
            <p class="quickstart-body">{{ step.body }}</p>
            <div class="quickstart-command">
              <code>{{ step.command }}</code>
              <docs-copy-command tone="ghost" size="sm" [value]="step.command" />
            </div>
          </div>
        </li>
      }
    </ol>
  `,
})
export class Quickstart {
  readonly steps = input.required<QuickstartStep[]>();
}
