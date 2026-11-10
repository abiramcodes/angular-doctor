import { diag, lineFromIndex, type RuleContext } from '../diag-helpers.js';
import { escapeRegExp } from '../match.js';
import type { Diagnostic } from '../../types.js';

const IMAGE_DOCS = 'https://angular.dev/guide/image-optimization';
const CHANGE_DETECTION_DOCS = 'https://angular.dev/best-practices/runtime-performance';
const PLACEHOLDER_BYTE_LIMIT = 4096;

interface ImgTag {
  tag: string;
  index: number;
}

function imgTags(content: string): ImgTag[] {
  const tags: ImgTag[] = [];
  const re = /<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    tags.push({ tag: match[0], index: match.index });
  }
  return tags;
}

function hasAttr(tag: string, name: string): boolean {
  const re = new RegExp(
    `(?:^|[\\s/])(?:\\[attr\\.${escapeRegExp(name)}\\]|\\[${escapeRegExp(name)}\\]|${escapeRegExp(name)})(?:=|[\\s/>])`,
    'i',
  );
  return re.test(tag);
}

function placeholderValue(tag: string): string | null {
  const match = tag.match(/(?:^|[\s])placeholder\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return match?.[1] ?? match?.[2] ?? null;
}

function dataUrlDecodedBytes(value: string): number | null {
  const match = value.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/);
  const payload = match?.[1];
  if (!payload || payload.length % 4 !== 0) {
    return null;
  }
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}

function isScannableTemplate(ctx: RuleContext): boolean {
  return ctx.file.endsWith('.html') || ctx.file.endsWith('.ts');
}

export function rulePreferNgOptimizedImage(ctx: RuleContext): Diagnostic[] {
  if (!isScannableTemplate(ctx)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const { tag, index } of imgTags(ctx.content)) {
    if (hasAttr(tag, 'ngSrc') || !hasAttr(tag, 'src')) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/prefer-ng-optimized-image',
          severity: 'info',
          category: 'performance',
          message: 'Image uses src. Prefer ngSrc with NgOptimizedImage.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Import NgOptimizedImage and replace src with ngSrc.',
          docsUrl: IMAGE_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleNgSrcDimensions(ctx: RuleContext): Diagnostic[] {
  if (!isScannableTemplate(ctx)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const { tag, index } of imgTags(ctx.content)) {
    if (!hasAttr(tag, 'ngSrc') || hasAttr(tag, 'fill')) {
      continue;
    }
    if (hasAttr(tag, 'width') && hasAttr(tag, 'height')) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/ng-src-dimensions',
          severity: 'warning',
          category: 'performance',
          message: 'ngSrc image is missing width or height and does not use fill.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Set width and height, or use fill when the parent is positioned.',
          docsUrl: IMAGE_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleNgSrcFillDimensions(ctx: RuleContext): Diagnostic[] {
  if (!isScannableTemplate(ctx)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const { tag, index } of imgTags(ctx.content)) {
    if (!hasAttr(tag, 'ngSrc') || !hasAttr(tag, 'fill')) {
      continue;
    }
    if (!hasAttr(tag, 'width') && !hasAttr(tag, 'height')) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/ng-src-fill-dimensions',
          severity: 'warning',
          category: 'performance',
          message: 'fill images should not also set width or height.',
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Remove width and height when using fill.',
          docsUrl: IMAGE_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleNgSrcPlaceholderSize(ctx: RuleContext): Diagnostic[] {
  if (!isScannableTemplate(ctx)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  let i = 0;
  for (const { tag, index } of imgTags(ctx.content)) {
    const value = placeholderValue(tag);
    if (!value?.startsWith('data:image/')) {
      continue;
    }
    const bytes = dataUrlDecodedBytes(value);
    if (bytes === null || bytes <= PLACEHOLDER_BYTE_LIMIT) {
      continue;
    }
    const pos = lineFromIndex(ctx.content, index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/ng-src-placeholder-size',
          severity: 'info',
          category: 'performance',
          message: `Data URL placeholder decodes to ${bytes} bytes, above the 4KB guidance.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion: 'Keep base64 placeholders under 4KB or use a loader-generated placeholder.',
          docsUrl: IMAGE_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export function ruleExplicitEagerChangeDetection(ctx: RuleContext): Diagnostic[] {
  if (!ctx.file.endsWith('.ts') || !/@Component\s*\(/.test(ctx.content)) {
    return [];
  }
  const findings: Diagnostic[] = [];
  const re = /changeDetection\s*:\s*ChangeDetectionStrategy\.(Default|Eager)\b/g;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(ctx.content)) !== null) {
    const pos = lineFromIndex(ctx.content, match.index);
    findings.push(
      diag(
        {
          ruleId: 'angular-doctor/explicit-eager-change-detection',
          severity: 'info',
          category: 'performance',
          message: `Explicit ${match[1]} change detection checks more of the component tree.`,
          file: ctx.file,
          line: pos.line,
          column: pos.column,
          suggestion:
            'Omit changeDetection on Angular 22+ (OnPush is the default) or set ChangeDetectionStrategy.OnPush.',
          docsUrl: CHANGE_DETECTION_DOCS,
        },
        i++,
      ),
    );
  }
  return findings;
}

export const PERFORMANCE_RULES = [
  rulePreferNgOptimizedImage,
  ruleNgSrcDimensions,
  ruleNgSrcFillDimensions,
  ruleNgSrcPlaceholderSize,
  ruleExplicitEagerChangeDetection,
] as const;
