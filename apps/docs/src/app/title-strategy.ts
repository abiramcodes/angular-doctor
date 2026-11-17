import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const DEFAULT_TITLE = 'Angular Doctor — A health check for your Angular codebase';

// Constructor injection is deliberate here: the router instantiates the
// TitleStrategy through paths that do not establish an injection context
// for field initializers (NG0203), while constructor parameters are
// resolved from the generated factory dependencies either way.
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly titleService: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.titleService.setTitle(title ? `${title} — Angular Doctor` : DEFAULT_TITLE);
  }
}
