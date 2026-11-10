import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

@Directive({
  selector: '[docsReveal]',
  host: {
    '[attr.data-reveal]': 'state()',
  },
})
export class Reveal {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly state = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      const media =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-reduced-motion: reduce)')
          : null;
      if (!media || media.matches) {
        return;
      }
      const node = this.host.nativeElement;
      const rect = node.getBoundingClientRect();
      const play = (): void => this.state.set('in');
      this.state.set('wait');
      if (rect.top < window.innerHeight * 0.98 && rect.bottom > 0) {
        requestAnimationFrame(() => requestAnimationFrame(play));
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return;
          }
          play();
          observer.disconnect();
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0 },
      );
      observer.observe(node);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
