import { createColors } from 'picocolors';
import type { Category } from '@angular-doctor/core/types';

export const COLOR_MODES = ['default', 'pastel', 'velvet'] as const;

export type ColorMode = (typeof COLOR_MODES)[number];

export type ColorRole = 'error' | 'warning' | 'success' | 'info' | 'progress' | 'report' | Category;

const pastel = {
  rose: '#f4a7b9',
  peach: '#f6c59a',
  mint: '#98d6b6',
  sky: '#93d2ea',
  lilac: '#c9b6f2',
  teal: '#8fd0c6',
} as const;

const velvet = {
  coral: '#ff6363',
  aster: '#d78ec1',
  indigo: '#a48cd9',
  deepBlue: '#9495e6',
} as const;

const HEX: Record<Exclude<ColorMode, 'default'>, Record<ColorRole, string>> = {
  pastel: {
    error: pastel.rose,
    warning: pastel.peach,
    success: pastel.mint,
    info: pastel.sky,
    progress: pastel.teal,
    report: pastel.sky,
    correctness: pastel.sky,
    performance: pastel.mint,
    maintainability: pastel.peach,
    security: pastel.rose,
    accessibility: pastel.lilac,
    hygiene: pastel.teal,
  },
  velvet: {
    error: velvet.coral,
    warning: velvet.aster,
    success: velvet.deepBlue,
    info: velvet.indigo,
    progress: velvet.deepBlue,
    report: velvet.indigo,
    correctness: velvet.indigo,
    performance: velvet.deepBlue,
    maintainability: velvet.aster,
    security: velvet.coral,
    accessibility: velvet.indigo,
    hygiene: velvet.aster,
  },
};

let activeMode: ColorMode = 'default';

export function setColorMode(mode: ColorMode): void {
  activeMode = mode;
}

export function parseColorMode(raw: string): ColorMode {
  const normalized = raw.toLowerCase();
  if ((COLOR_MODES as readonly string[]).includes(normalized)) {
    return normalized as ColorMode;
  }
  throw new Error(`Invalid --colors "${raw}". Use default, pastel, or velvet.`);
}

export function colorize(text: string, role: ColorRole, bold = false): string {
  const enabled = process.stdout.isTTY === true || process.stderr.isTTY === true;
  if (!enabled) {
    return text;
  }
  const colored =
    activeMode === 'default' ? defaultInk(text, role) : hexInk(text, HEX[activeMode][role]);
  return bold ? `\x1b[1m${colored}\x1b[22m` : colored;
}

function defaultInk(text: string, role: ColorRole): string {
  const pc = createColors(true);
  switch (role) {
    case 'error':
    case 'security':
      return pc.red(text);
    case 'warning':
      return pc.yellow(text);
    case 'success':
    case 'performance':
      return hexInk(text, '#3ECF8E');
    case 'maintainability':
      return pc.magenta(text);
    case 'hygiene':
      return pc.blue(text);
    case 'info':
    case 'accessibility':
      return `\x1b[38;5;117m${text}\x1b[39m`;
    case 'progress':
    case 'report':
    case 'correctness':
      return pc.cyan(text);
  }
}

function hexInk(text: string, hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `\x1b[38;2;${red};${green};${blue}m${text}\x1b[39m`;
}
