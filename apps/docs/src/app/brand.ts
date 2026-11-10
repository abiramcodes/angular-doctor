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
      <rect x="0.5" y="0.5" width="31" height="31" rx="5" stroke="var(--line-strong)" />
      <path
        d="M4.5 16h6l3-7 4 14 3-7h7"
        stroke="var(--green)"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="25.5" cy="9" r="2" fill="var(--magenta)" />
    </svg>
  `,
})
export class BrandMark {
  readonly size = input(28);
}
