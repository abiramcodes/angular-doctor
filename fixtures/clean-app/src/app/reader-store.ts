import { Service, signal } from '@angular/core';

@Service()
export class ReaderStore {
  readonly seen = signal(false);
  readonly visits = signal(0);
}
