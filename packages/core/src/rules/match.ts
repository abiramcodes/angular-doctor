/**
 * Scan with a new RegExp on every call.
 * A shared /g regexp keeps lastIndex, so the next shorter file can be skipped.
 */
export function execAll(content: string, pattern: RegExp): RegExpExecArray[] {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    matches.push(match);
    if (match[0].length === 0) {
      re.lastIndex += 1;
    }
  }
  return matches;
}
