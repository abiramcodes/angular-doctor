import { afterNextRender, Directive, ElementRef, inject, signal } from '@angular/core';

export interface TocItem {
  id: string;
  label: string;
}

@Directive({
  selector: '[docToc]',
})
export class DocToc {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly items = signal<TocItem[]>([]);

  constructor() {
    afterNextRender(() => {
      const nodes = this.el.nativeElement.querySelectorAll<HTMLElement>('h2[id]');
      const items = Array.from(nodes).map((node) => ({
        id: node.id,
        label: node.textContent?.trim() ?? '',
      }));
      this.items.set(items);
    });
  }
}
