import { Location } from '@angular/common';
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
  private readonly location = inject(Location);

  readonly items = signal<TocItem[]>([]);
  readonly active = signal('');

  private observer: IntersectionObserver | null = null;
  private nodes: HTMLElement[] = [];

  constructor() {
    afterNextRender(() => {
      this.collect();
      // Filters and other in-page changes add or remove headings after the
      // first render; keep the table of contents in sync with the live DOM.
      const mutations = new MutationObserver(() => this.collect());
      mutations.observe(this.el.nativeElement, { childList: true, subtree: true });
      // Anchor jumps (TOC clicks, #fragment URLs) may land where the scroll
      // observer never fires — e.g. short pages or instant jumps. The URL
      // fragment is the source of truth there.
      const onHashChange = (): void => {
        this.followFragment();
      };
      window.addEventListener('hashchange', onHashChange);
      // Near the bottom of a short page the last headings may never enter the
      // observer band; pin the highlight to the final heading instead.
      let scrollQueued = false;
      const onScroll = (): void => {
        if (scrollQueued) {
          return;
        }
        scrollQueued = true;
        requestAnimationFrame(() => {
          scrollQueued = false;
          this.pinToBottom();
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        mutations.disconnect();
        window.removeEventListener('hashchange', onHashChange);
        window.removeEventListener('scroll', onScroll);
        this.observer?.disconnect();
      });
    });
  }

  private collect(): void {
    const nodes = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>('h2[id]'));
    const next: TocItem[] = nodes.map((node) => ({
      id: node.id,
      label: node.textContent?.trim() ?? '',
    }));
    const current = this.items();
    const unchanged =
      current.length === next.length &&
      current.every((item, i) => item.id === next[i]?.id && item.label === next[i]?.label);
    if (unchanged && nodes.length === this.nodes.length) {
      return;
    }
    this.nodes = nodes;
    this.items.set(next);

    this.observer?.disconnect();
    this.observer = null;
    if (!nodes.length || typeof IntersectionObserver === 'undefined') {
      this.active.set('');
      return;
    }

    if (!this.followFragment() && !nodes.some((node) => node.id === this.active())) {
      this.active.set(nodes[0]!.id);
    }
    const visible = new Set<Element>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target);
          } else {
            visible.delete(entry.target);
          }
        }
        const first = this.nodes.find((node) => visible.has(node));
        if (first) {
          this.active.set(first.id);
        }
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    for (const node of nodes) {
      this.observer.observe(node);
    }
  }

  /** Highlight the heading named by the URL fragment, if it is on this page. */
  private followFragment(): boolean {
    const hash = this.location.path().split('#')[1] ?? '';
    const id = decodeURIComponent(hash);
    if (id && this.nodes.some((node) => node.id === id)) {
      this.active.set(id);
      return true;
    }
    return false;
  }

  /** At the very bottom of the page, the last heading owns the highlight. */
  private pinToBottom(): void {
    if (this.nodes.length === 0) {
      return;
    }
    const doc = document.scrollingElement ?? document.documentElement;
    if (doc.scrollHeight - window.innerHeight - window.scrollY <= 2) {
      this.active.set(this.nodes[this.nodes.length - 1]!.id);
    }
  }
}
