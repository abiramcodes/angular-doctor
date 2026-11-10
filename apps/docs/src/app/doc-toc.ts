import { DestroyRef, Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

export interface TocItem {
  id: string;
  label: string;
}

@Directive({
  selector: '[docToc]',
})
export class DocToc {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<TocItem[]>([]);
  readonly active = signal('');

  constructor() {
    afterNextRender(() => {
      const nodes = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>('h2[id]'));
      this.items.set(
        nodes.map((node) => ({
          id: node.id,
          label: node.textContent?.trim() ?? '',
        })),
      );
      if (!nodes.length || typeof IntersectionObserver === 'undefined') {
        return;
      }

      this.active.set(nodes[0].id);
      const visible = new Set<Element>();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visible.add(entry.target);
            } else {
              visible.delete(entry.target);
            }
          }
          const first = nodes.find((node) => visible.has(node));
          if (first) {
            this.active.set(first.id);
          }
        },
        { rootMargin: '-96px 0px -60% 0px' },
      );
      for (const node of nodes) {
        observer.observe(node);
      }
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
