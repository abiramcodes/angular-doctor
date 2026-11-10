import { CATEGORIES, type Category } from '@angular-doctor/core/types';

export function parseCategory(raw: string): Category {
  const normalized = raw.toLowerCase();
  const found = CATEGORIES.find((category) => category === normalized);
  if (!found) {
    throw new Error(`Invalid --category "${raw}". Use ${CATEGORIES.join(', ')}.`);
  }
  return found;
}
