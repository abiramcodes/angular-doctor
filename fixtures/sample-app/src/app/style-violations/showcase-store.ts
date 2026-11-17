import { Service, signal } from '@angular/core';

@Service()
export class ShowcaseStore {
  readonly seen = signal(false);
}
