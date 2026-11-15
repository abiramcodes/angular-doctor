import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `<p *ngIf="ready">Hi</p>`,
})
export class App implements OnDestroy {
  protected ready = true;
  private readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
