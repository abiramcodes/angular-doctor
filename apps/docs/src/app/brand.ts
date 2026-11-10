import { Component, input } from '@angular/core';

let nextBrandId = 0;

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
      <defs>
        <linearGradient
          [attr.id]="gradientId"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#2E2A8F" />
          <stop offset="0.55" stop-color="#5A49D9" />
          <stop offset="1" stop-color="#9A8CF0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" [attr.fill]="'url(#' + gradientId + ')'" />
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
  protected readonly gradientId = `brand-gradient-${nextBrandId++}`;
}
