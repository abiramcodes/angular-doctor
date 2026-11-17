import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * The other half of the 0.3.0 showcase: genuine problems the updated
 * rules must still catch. Expected findings when scanning this file:
 * prefer-document-token, inner-html (x2), security-bypass, ng-model-name,
 * effect-writes-state, target-blank, template-eslint/alt-text, and
 * template-eslint/no-positive-tabindex.
 */
@Component({
  selector: 'app-showcase-violations',
  imports: [FormsModule],
  template: `
    <!-- Fed by bypassSecurityTrustHtml below: the sanitizer is off. -->
    <article [innerHTML]="trustedHtml"></article>

    <!-- No alt at all: template-eslint/alt-text. -->
    <img src="cover.png" />

    <!-- Positive tabindex breaks natural focus order. -->
    <div tabindex="3">Jump the queue</div>

    <form>
      <!-- Inside a form with no name and no standalone option: NG01352. -->
      <input [(ngModel)]="draft" />
    </form>

    <!-- Missing rel="noopener". -->
    <a target="_blank" href="https://angular.dev">Angular docs</a>

    <div #rawHost></div>
  `,
})
export class ShowcaseViolations {
  protected readonly draft = signal('');
  protected readonly count = signal(0);
  protected readonly trustedHtml = inject(DomSanitizer).bypassSecurityTrustHtml('<b>raw</b>');

  private readonly rawHost = viewChild<ElementRef<HTMLElement>>('rawHost');

  constructor() {
    // Same-file signal write inside an effect: use computed() instead.
    effect(() => {
      this.count.set(this.draft().length);
    });
  }

  paint(): void {
    // Unresolved global document: inject DOCUMENT instead.
    document.title = 'Painted';
    // Direct assignment is never sanitized by Angular.
    const host = this.rawHost();
    if (host) {
      host.nativeElement.innerHTML = '<i>raw</i>';
    }
  }
}
