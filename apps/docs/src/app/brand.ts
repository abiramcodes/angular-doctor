import { Component, input } from '@angular/core';

@Component({
  selector: 'docs-brand-mark',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="var(--signal)" />
      <path
        d="M5 16h6l3-7 4 14 3-7h6"
        stroke="#ffffff"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class BrandMark {
  readonly size = input(28);
}
