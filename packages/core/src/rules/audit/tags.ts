import { execAll } from '../match.js';

export function openingTags(content: string): { tag: string; index: number }[] {
  return execAll(content, /<[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>/g).map((match) => ({
    tag: match[0],
    index: match.index,
  }));
}

export function attr(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, 'i').exec(tag);
  return match ? match[2] : null;
}
