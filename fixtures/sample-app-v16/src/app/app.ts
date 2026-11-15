import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `<p *ngIf="ready">Hi</p>`,
})
export class App {
  protected ready = true;
  protected name = new FormControl('');
  private readonly http = inject(HttpClient);

  load(): void {
    this.http.get('/api').subscribe();
  }
}
