import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-host-slider',
  template: '',
})
export class HostSlider {
  @HostListener('keydown', ['$event'])
  updateValue(event: KeyboardEvent): void {
    void event;
  }
}
