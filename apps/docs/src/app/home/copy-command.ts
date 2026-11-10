import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy } from '@ng-icons/lucide';

type CopyTone = 'primary' | 'quiet' | 'ghost';

@Component({
  selector: 'docs-copy-command',
  host: { class: 'inline-flex shrink-0' },
  imports: [NgIcon],
  providers: [provideIcons({ lucideCheck, lucideCopy })],
  template: `
    <button
      type="button"
      class="copy-btn press"
      [class.copy-btn--primary]="tone() === 'primary'"
      [class.copy-btn--ghost]="tone() === 'ghost'"
      [class.copy-btn--sm]="size() === 'sm'"
      [class.copy-btn--wide]="!!text()"
      [attr.aria-label]="label()"
      (click)="copy()"
    >
      <ng-icon [name]="icon()" [size]="size() === 'sm' ? '14' : '16'" aria-hidden="true" />
      @if (text(); as visible) {
        <span>{{ statusText(visible) }}</span>
      }
      <span class="sr-only" aria-live="polite">{{ liveText() }}</span>
    </button>
  `,
})
export class CopyCommand {
  readonly value = input.required<string>();
  readonly tone = input<CopyTone>('quiet');
  readonly size = input<'md' | 'sm'>('md');
  readonly text = input<string | null>(null);
  private readonly destroyRef = inject(DestroyRef);
  readonly status = signal<'idle' | 'copied' | 'failed'>('idle');

  private timer = 0;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected readonly icon = computed(() =>
    this.status() === 'copied' ? 'lucideCheck' : 'lucideCopy',
  );

  protected readonly label = computed(() => {
    const status = this.status();
    const verb = status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : 'Copy';
    return `${verb}: ${this.value()}`;
  });

  protected readonly liveText = computed(() => {
    const status = this.status();
    return status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : '';
  });

  protected statusText(defaultText: string): string {
    const status = this.status();
    return status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : defaultText;
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value());
      this.status.set('copied');
    } catch {
      this.status.set('failed');
    }
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.status.set('idle'), 1600);
  }
}
