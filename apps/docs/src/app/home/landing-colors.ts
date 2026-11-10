import { Component, computed, signal } from '@angular/core';
import { TerminalSample } from './terminal-sample';
import {
  paletteById,
  palettes,
  sampleCaption,
  summaryLines,
  type PaletteId,
} from './landing-content';

@Component({
  selector: 'docs-landing-colors',
  host: { class: 'block min-w-0 max-w-full' },
  imports: [TerminalSample],
  template: `
    <p class="text-sm leading-6 text-muted-foreground">
      <code>--colors</code> picks default, pastel, or velvet. Color is printed only when the output
      is a terminal.
    </p>

    <div class="palette-switch mt-5" role="group" aria-label="Preview a palette">
      @for (mode of palettes; track mode.id) {
        <button
          type="button"
          class="palette-switch-btn"
          [class.is-active]="palette() === mode.id"
          [attr.aria-pressed]="palette() === mode.id"
          (click)="choose(mode.id)"
        >
          {{ mode.label }}
        </button>
      }
    </div>

    <p class="mt-4 max-w-[68ch] text-sm leading-6 text-muted-foreground" aria-live="polite">
      {{ active().summary }}
    </p>

    <ul class="swatch-list mt-6">
      @for (swatch of active().swatches; track swatch.roles) {
        <li class="swatch">
          <span class="swatch-chip" [style.background]="swatch.preview" aria-hidden="true"></span>
          <span class="swatch-roles">{{ swatch.roles }}</span>
          <span class="swatch-value">{{ swatch.value }}</span>
        </li>
      }
    </ul>

    <div class="mt-6">
      <docs-terminal-sample
        anchor="palette-preview"
        [palette]="palette()"
        [lines]="summaryLines"
        [caption]="caption()"
      />
    </div>
  `,
})
export class LandingColors {
  protected readonly palettes = palettes;
  protected readonly summaryLines = summaryLines;
  protected readonly palette = signal<PaletteId>('default');
  protected readonly active = computed(() => paletteById(this.palette()));
  protected readonly caption = computed(() => `${this.active().label}. ${sampleCaption}`);

  protected choose(id: PaletteId): void {
    this.palette.set(id);
  }
}
