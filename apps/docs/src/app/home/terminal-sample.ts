import { Component, OnInit, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCw } from '@ng-icons/lucide';
import {
  previewColor,
  type PaletteId,
  type PaletteRole,
  type TerminalLine,
} from './landing-content';

@Component({
  selector: 'docs-terminal-sample',
  host: { class: 'block min-w-0 max-w-full' },
  imports: [NgIcon],
  providers: [provideIcons({ lucideRotateCw })],
  template: `
    <figure class="terminal" [attr.id]="anchor()">
      <figcaption class="terminal-head">
        <span class="terminal-dots" aria-hidden="true"
          ><span></span><span></span><span></span
        ></span>
        <span class="terminal-title">{{ title() }}</span>
        <span class="terminal-meta">{{ meta() }}</span>
        <button
          type="button"
          class="terminal-replay"
          [disabled]="scanning()"
          aria-label="Replay the scan"
          (click)="replay()"
        >
          <ng-icon name="lucideRotateCw" size="14" aria-hidden="true" />
        </button>
      </figcaption>
      <div class="terminal-body" [class.is-scanning]="scanning()">
        @if (scanning()) {
          <div class="scan-veil" aria-hidden="true">
            <p>Scanning sample workspace</p>
            <span class="scan-track"><span class="scan-fill"></span></span>
          </div>
        }
        @for (line of lines(); track $index) {
          @if (line.meter; as meter) {
            <p class="terminal-line">
              <span class="terminal-dim">Health</span>
              <span class="terminal-track" aria-hidden="true">
                <span
                  class="terminal-fill"
                  [style.width.%]="meter.fill"
                  [style.background]="ink(meter.tone)"
                ></span>
              </span>
              <span class="terminal-score">
                <span [style.color]="ink(meter.tone)">{{ meter.score }}</span>
                <span class="terminal-dim"> / 100</span>
              </span>
            </p>
          } @else if (line.tokens.length === 1 && line.tokens[0].text === '') {
            <p
              class="terminal-line terminal-line--empty"
              [style.animation-delay.ms]="lineDelay($index)"
            ></p>
          } @else {
            <p class="terminal-line" [style.animation-delay.ms]="lineDelay($index)">
              @for (token of line.tokens; track $index) {
                @if (token.role; as role) {
                  <span
                    [style.color]="ink(role)"
                    [class.font-semibold]="token.strong"
                    [attr.aria-hidden]="token.decorative ? true : null"
                    >{{ token.text }}</span
                  >
                } @else if (token.dim) {
                  <span class="terminal-dim" [attr.aria-hidden]="token.decorative ? true : null">{{
                    token.text
                  }}</span>
                } @else {
                  <span>{{ token.text }}</span>
                }
              }
            </p>
          }
        }
      </div>
      <figcaption class="terminal-caption">{{ caption() }}</figcaption>
    </figure>
  `,
})
export class TerminalSample implements OnInit {
  readonly palette = input<PaletteId>('default');
  readonly lines = input.required<TerminalLine[]>();
  readonly caption = input.required<string>();
  readonly title = input('angular-doctor — sample');
  readonly meta = input('Angular 22.2 · 299 ms');
  readonly anchor = input<string | null>(null);
  readonly playScan = input(false);
  readonly scanning = signal(true);

  ngOnInit(): void {
    this.scanning.set(this.playScan());
  }

  protected ink(role: PaletteRole): string {
    return previewColor(this.palette(), role);
  }

  protected lineDelay(index: number): number {
    return 780 + index * 70;
  }

  protected replay(): void {
    this.scanning.set(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scanning.set(true));
    });
  }
}
