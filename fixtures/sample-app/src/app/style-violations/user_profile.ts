import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `<button (click)="handleClick()">Save</button>`,
})
export class UserProfile {
  @Input() visible = true;

  handleClick(): void {
    // placeholder
  }
}
