import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Landing } from './landing';

describe('Landing', () => {
  it('shows the score, the command, and a real finding', async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();

    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Your codebase, live.');
    expect(text).toContain('npx angular-doctor@latest');
    expect(text).toContain('85');
    expect(text).toContain('suggested fix');
    expect(text).toContain('angular-doctor-report.md');
    expect(text).toContain('76 built-in checks');
    expect(text).not.toContain('What it is');
  });
});
