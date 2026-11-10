import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideInfo,
  lucideLightbulb,
  lucideOctagonAlert,
  lucideTriangleAlert,
} from '@ng-icons/lucide';

type CalloutVariant = 'note' | 'tip' | 'warning' | 'error';

@Component({
  selector: 'docs-callout',
  host: { class: 'block' },
  imports: [NgIcon],
  providers: [
    provideIcons({ lucideInfo, lucideLightbulb, lucideOctagonAlert, lucideTriangleAlert }),
  ],
  template: `
    <div
      class="callout"
      role="note"
      [class.callout-note]="variant() === 'note'"
      [class.callout-tip]="variant() === 'tip'"
      [class.callout-warning]="variant() === 'warning'"
      [class.callout-error]="variant() === 'error'"
    >
      <ng-icon [name]="icon()" size="16" class="callout-icon" aria-hidden="true" />
      <div class="callout-body">
        @if (label(); as text) {
          <p class="callout-label">{{ text }}</p>
        }
        <ng-content />
      </div>
    </div>
  `,
})
export class Callout {
  readonly variant = input<CalloutVariant>('note');
  readonly label = input<string | null>(null);

  protected readonly icon = computed(() => {
    switch (this.variant()) {
      case 'tip':
        return 'lucideLightbulb';
      case 'warning':
        return 'lucideTriangleAlert';
      case 'error':
        return 'lucideOctagonAlert';
      default:
        return 'lucideInfo';
    }
  });
}
