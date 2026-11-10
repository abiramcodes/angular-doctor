import { Component, input } from '@angular/core';
import { CopyCommand } from './home/copy-command';

@Component({
  selector: 'docs-code-block',
  host: { class: 'block' },
  imports: [CopyCommand],
  template: `
    <figure class="code-panel">
      <figcaption class="code-panel-head">
        @if (label(); as text) {
          <span class="code-panel-label">{{ text }}</span>
        }
        @if (lang(); as text) {
          <span class="code-panel-lang">{{ text }}</span>
        }
        <docs-copy-command tone="ghost" size="sm" [value]="code()" />
      </figcaption>
      <pre class="code-panel-body"><code>{{ code() }}</code></pre>
    </figure>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly label = input<string | null>(null);
  readonly lang = input<string | null>(null);
}
