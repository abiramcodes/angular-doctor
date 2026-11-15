import { Component } from '@angular/core';
import { DocPage } from '../../doc-page';
import { LandingColors } from '../../home/landing-colors';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Colors' };

@Component({
  selector: 'docs-colors',
  imports: [DocPage, LandingColors],
  template: `
    <docs-page [title]="'Colors'" [lede]="lede">
      <docs-landing-colors />
    </docs-page>
  `,
})
export default class DocsColors {
  protected readonly lede =
    "Three palettes for the terminal summary. The default palette uses your terminal's ANSI colors.";
}
