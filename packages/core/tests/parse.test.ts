import { describe, expect, it } from 'vitest';
import {
  declaredSignalNames,
  isDeclaredInFile,
  maskCommentsAndStrings,
  sliceParens,
} from '../src/rules/preferences/parse.js';

describe('maskCommentsAndStrings', () => {
  it('preserves length, offsets, and newlines', () => {
    const source = "const a = 'x';\n// note\nconst b = 1;";
    const masked = maskCommentsAndStrings(source);
    expect(masked).toHaveLength(source.length);
    expect(masked.split('\n')).toHaveLength(3);
    expect(masked).toContain('const b = 1;');
    expect(masked).not.toContain('note');
  });

  it('handles escaped quotes and template literals', () => {
    const source = "const s = 'it\\'s document.x'; const t = `document.y`; document.z;";
    const masked = maskCommentsAndStrings(source);
    expect(masked).toContain('document.z;');
    expect(masked).not.toContain('document.x');
    expect(masked).not.toContain('document.y');
  });

  it('keeps code after a block comment visible', () => {
    expect(maskCommentsAndStrings('/* ( */ run();')).toContain('run();');
  });
});

describe('sliceParens', () => {
  it('ignores parentheses inside strings', () => {
    const content = "effect(() => { log(')'); go(); })";
    const span = sliceParens(content, content.indexOf('('));
    expect(span?.text).toBe(content.slice(content.indexOf('(')));
    expect(span?.text).toContain('go();');
  });
});

describe('declaredSignalNames', () => {
  it('collects fields and locals from signal factories', () => {
    const content = [
      'export class A {',
      '  readonly count = signal<number>(0);',
      '  name = model("");',
      '  doubled = linkedSignal(() => 1);',
      '  plain = 1;',
      '}',
      'const local = signal(false);',
    ].join('\n');
    expect([...declaredSignalNames(content)].sort()).toEqual(['count', 'doubled', 'local', 'name']);
  });

  it('ignores signal-looking text in comments', () => {
    expect(declaredSignalNames('// count = signal(0);\n')).toEqual(new Set());
  });
});

describe('isDeclaredInFile', () => {
  it('detects variables, fields, and parameters', () => {
    expect(isDeclaredInFile('const document = inject(DOCUMENT);', 'document')).toBe(true);
    expect(isDeclaredInFile('private readonly document = inject(DOCUMENT);', 'document')).toBe(
      true,
    );
    expect(isDeclaredInFile('function f(document: Document) {}', 'document')).toBe(true);
    expect(isDeclaredInFile('document.title = "x";', 'document')).toBe(false);
  });
});
