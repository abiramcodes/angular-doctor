import { Component } from '@angular/core';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Changelog' };

@Component({
  selector: 'docs-changelog',
  template: `
    <div class="shell">
      <article class="changelog">
        <header class="docs-header">
          <h1 class="docs-title">Changelog</h1>
          <p class="docs-lede">What shipped, and what changed.</p>
        </header>
        <ol class="changelog-list">
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.3.0</h2>
              <p class="changelog-status">Current package</p>
              <ul>
                <li>
                  Breaking: angular-doctor now checks Angular semantics only. Thirteen rules are
                  removed. client-secret and env-file are gone (use a dedicated secret scanner;
                  public client identifiers such as Firebase web API keys were reported as secrets).
                  img-alt, click-without-keyboard, positive-tabindex, and control-missing-label are
                  replaced by the bundled template-eslint/alt-text, click-events-have-key-events,
                  no-positive-tabindex, and label-has-associated-control rules, which understand
                  bound attributes such as [alt] and controls wrapped in label elements.
                  cleanup-unused-imports-hint is covered by Oxlint no-unused-vars, and unused-export
                  belongs to knip or Sonar. complex-component, repeated-template,
                  repeated-component-logic, and template-complexity are removed: SonarQube /
                  SonarQube Cloud measure duplication and cognitive/cyclomatic complexity properly,
                  and lifecycle-hook-complexity stays because it is Angular-specific. Old rule ids
                  left in config are ignored; rules explain on a removed id now errors.
                </li>
                <li>
                  template-arrow-not-called is removed. security-bypass and ng-model-name are
                  now warnings instead of errors — both call for review rather than a guaranteed
                  break. Raise either back to error per rule in config if your team wants the
                  stricter gate.
                </li>
                <li>
                  Scoring: the removed accessibility rules counted as errors and their template
                  replacements count as warnings, and template-complexity counted as a warning.
                  Scores can rise on this release without any code change.
                </li>
                <li>
                  prefer-document-token no longer fires when document is a local binding, for
                  example const document = inject(DOCUMENT). Only the unresolved global counts.
                </li>
                <li>
                  inner-html no longer fires on a plain [innerHTML] binding, which Angular's
                  sanitizer already handles (the right setup for rendered markdown). It fires on
                  direct .innerHTML assignments and on [innerHTML] in a file that calls
                  bypassSecurityTrust*.
                </li>
                <li>
                  ng-model-name only fires inside a form element. Formless ngModel, a bound [name],
                  and standalone ngModelOptions no longer count.
                </li>
                <li>
                  effect-writes-state only fires when effect() writes a signal declared in the same
                  file. Writes to service or store signals, and side effects such as setting the tab
                  title, do not count.
                </li>
                <li>
                  target-blank accepts a bound [rel]. TypeScript rules no longer match trigger words
                  inside comments or string literals.
                </li>
                <li>
                  Edge-case fixes found by new per-rule tests: .innerHTML += is caught, &#64;for
                  track detection works when the brace is on the next line, tsconfig array-form
                  extends is honored, double-quoted inline templates and acronym class names
                  (URLParser in url-parser.ts) pass, member-order recognizes input&lt;T&gt;()
                  generics, afterRenderEffect writes count like effect writes, and the
                  modernization rules ignore trigger words in comments and strings.
                </li>
                <li>
                  prefer-service-decorator only fires for providedIn: 'root' singletons,
                  prefer-inject skips subclasses that forward dependencies to super(), and
                  prefer-lazy-routes skips the empty-path shell component.
                </li>
              </ul>
            </div>
          </li>
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.2.1</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>
                  Breaking: check levels are gone. The strict behavior is the default — correctness,
                  security, and accessibility warnings count as errors and style-guide notes count
                  as warnings. The --level flag and the level config key no longer exist. Soften a
                  rule per rule under rules in config.
                </li>
                <li>angular-doctor/impure-pipe is now an error, not a warning.</li>
                <li>
                  angular-doctor/prefer-signal-query is now a warning. It flags each @ViewChild,
                  @ViewChildren, @ContentChild, and @ContentChildren and names the signal query to
                  use instead.
                </li>
                <li>
                  Angular 15 or newer is required. Angular 17+ gets every check; Angular 15–16 scan
                  in compat mode, where rules that need newer Angular stay off instead of flagging
                  correct old code. Older versions stop with a clear message.
                </li>
                <li>
                  Findings are grouped once per rule in the terminal and in reports. --html also
                  writes a self-contained angular-doctor-report.html with category tabs, a severity
                  filter whose tab counts update live, and reference links that open in a new tab.
                </li>
                <li>
                  New rules: inject-async-target (error), prefer-inject-async,
                  template-for-allocation, and getter-in-template (error — a template reading a
                  class getter re-runs it on every change detection cycle).
                </li>
                <li>
                  Scans understand multi-project angular.json and Nx workspaces. The DOCUMENT check
                  is a warning when SSR or prerendering is configured.
                </li>
                <li>
                  Oxlint runs in the bundled CLI again. Decorated classes are no longer reported as
                  unused exports, --scope changed includes untracked files and scans nothing on a
                  clean tree, report paths are relative, and generated HTML reports are excluded
                  from later scans.
                </li>
                <li>
                  Templates are now linted for real: eslint and the Angular template rules ship as
                  dependencies of the engine and run on standalone templates and inline component
                  templates.
                </li>
                <li>New check: &#64;defer without an on/when/prefetch trigger is a warning.</li>
                <li>
                  Docs fixes: page titles reset on client-side navigation via a TitleStrategy, and
                  the rules page "On this page" list follows the severity filter. The rules page
                  groups by category with severity colors and an All/Errors/Warnings/Info filter.
                </li>
              </ul>
            </div>
          </li>
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.1.2</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>
                  An error costs 1.5 in each file. A warning still costs 0.75 once per rule. Notes
                  still do not change the score.
                </li>
                <li>Oxlint findings keep their rule id and the line they were found on.</li>
                <li>
                  The landing headline is "Check Angular code." Angular sits on the lamp-red block.
                </li>
                <li>The docs pointer is a scan reticle. Clicks land on the red square.</li>
                <li>Overview commands place the copy control at the right edge of the command.</li>
              </ul>
            </div>
          </li>
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.1.1</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>Scan .ts and .html only. .js, .mjs, .cjs, and .tsx are no longer read.</li>
                <li>
                  A check that cannot finish on a file is skipped. The summary names that file, and
                  the rest of the scan still runs.
                </li>
                <li>
                  Import text copied from a file is treated as an identifier, so a string that looks
                  like an import no longer stops the run.
                </li>
              </ul>
            </div>
          </li>
          <li class="changelog-entry">
            <span class="changelog-marker" aria-hidden="true"></span>
            <div class="changelog-body">
              <h2 class="changelog-version">0.1.0</h2>
              <p class="changelog-status">Released on npm</p>
              <ul>
                <li>Scan an Angular or Nx project and print a 0–100 health score.</li>
                <li>Group findings into errors, warnings, and notes.</li>
                <li>Write an agent-ready Markdown report when the scan is not clean.</li>
                <li>List and explain rules, and recommend official Angular migrations.</li>
                <li>Install a starter GitHub Actions workflow.</li>
              </ul>
            </div>
          </li>
        </ol>
      </article>
    </div>
  `,
})
export default class Changelog {}
