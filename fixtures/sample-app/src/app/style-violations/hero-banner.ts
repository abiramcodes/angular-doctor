import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero-banner',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <img src="logo.png" alt="Logo" />
    <img ngSrc="hero.jpg" alt="Hero" />
    <img ngSrc="fill.jpg" fill width="100" height="50" alt="" />
  `,
})
export class HeroBanner {}
