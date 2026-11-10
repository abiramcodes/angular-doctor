import { Component } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-legacy-listener',
  template: '',
})
export class LegacyListener {
  private readonly destroy$ = new Subject<void>();
  private readonly clicks$ = new Subject<void>();

  recordClick(): void {
    this.clicks$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
