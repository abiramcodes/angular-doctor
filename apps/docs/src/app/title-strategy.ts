import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const DEFAULT_TITLE = 'Angular Doctor — A health check for your Angular codebase';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.titleService.setTitle(title ? `${title} — Angular Doctor` : DEFAULT_TITLE);
  }
}
