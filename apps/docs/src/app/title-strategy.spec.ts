import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { AppTitleStrategy, DEFAULT_TITLE } from './title-strategy';

describe('AppTitleStrategy', () => {
  it('is constructed by the injector and sets the default title', () => {
    const titles: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: TitleStrategy, useClass: AppTitleStrategy },
        { provide: Title, useValue: { setTitle: (value: string) => titles.push(value) } },
      ],
    });

    const strategy = TestBed.inject(TitleStrategy);
    expect(strategy).toBeInstanceOf(AppTitleStrategy);

    const snapshot = {
      root: { data: {}, children: [] },
    } as unknown as RouterStateSnapshot;
    strategy.updateTitle(snapshot);
    expect(titles).toEqual([DEFAULT_TITLE]);
  });
});
