import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-legacy-panel',
  standalone: true,
  template: `
    <div *ngIf="visible">
      <ul>
        <li *ngFor="let item of items">{{ item }}</li>
      </ul>
    </div>
  `,
})
export class LegacyPanelComponent {
  @Input() visible = true;
  items = ['alpha', 'beta'];

  constructor(private readonly http: HttpClient) {}
}
