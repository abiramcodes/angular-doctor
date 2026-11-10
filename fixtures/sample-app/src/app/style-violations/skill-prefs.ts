import { Component, effect, Pipe, signal } from '@angular/core';

@Pipe({ name: 'legacy-date', pure: false })
export class LegacyDatePipe {
  transform(value: string): string {
    return value;
  }
}

@Component({
  selector: 'app-skill-prefs',
  template: `
    <ng-template>
      <ng-content />
    </ng-template>
    <button (click)="() => save()">Save</button>
  `,
})
export class SkillPrefs {
  private readonly count = signal(0);

  constructor() {
    effect(() => {
      this.count.set(1);
    });
  }

  save(): void {
    this.count.update((value) => value + 1);
  }
}
