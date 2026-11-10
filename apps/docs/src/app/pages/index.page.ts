import { Component } from '@angular/core';
import { Landing } from '../home/landing';

@Component({
  selector: 'docs-home',
  imports: [Landing],
  template: `<docs-landing />`,
})
export default class Home {}
