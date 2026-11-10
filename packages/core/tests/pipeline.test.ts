import { describe, expect, it } from 'vitest';
import { pipelineRuleIds } from '../src/rules/pipeline.js';
import { builtinPipeline } from '../src/rules/registry.js';
import { getCatalogEntry } from '../src/rules/style-guide-catalog.js';

describe('builtin pipeline', () => {
  it('lists each rule id once and keeps each kind in one span', () => {
    const ids = pipelineRuleIds(builtinPipeline);
    expect(new Set(ids).size).toBe(ids.length);
    const kinds = builtinPipeline.map((item) => item.kind);
    const seen = new Set<string>();
    let previous = '';
    for (const kind of kinds) {
      if (kind !== previous && seen.has(kind)) {
        throw new Error(`kind ${kind} is split`);
      }
      seen.add(kind);
      previous = kind;
    }
  });

  it('covers every style-guide catalog id', () => {
    const ids = new Set(pipelineRuleIds(builtinPipeline));
    const catalogIds = [
      'angular-doctor/file-hyphen-case',
      'angular-doctor/missing-spec-file',
      'angular-doctor/filename-class-mismatch',
      'angular-doctor/component-file-set-mismatch',
      'angular-doctor/generic-filename',
      'angular-doctor/naming-convention-mix',
      'angular-doctor/project-layout',
      'angular-doctor/type-based-folder',
      'angular-doctor/one-concept-per-file',
      'angular-doctor/prefer-readonly-signals',
      'angular-doctor/lifecycle-interface',
      'angular-doctor/lifecycle-hook-complexity',
      'angular-doctor/member-order',
      'angular-doctor/generic-event-handler',
      'angular-doctor/template-complexity',
    ];
    for (const id of catalogIds) {
      expect(getCatalogEntry(id)?.ruleId).toBe(id);
      expect(ids.has(id)).toBe(true);
    }
  });
});
