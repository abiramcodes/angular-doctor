import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocPage } from '../../doc-page';
import { CodeBlock } from '../../code-block';
import { Callout } from '../../callout';
import {
  configExample,
  configHelp,
  excerptNote,
  markdownExcerpt,
  outputIntro,
  reportSections,
} from '../../home/landing-content';
import type { RouteMeta } from '@analogjs/router';

export const routeMeta: RouteMeta = { title: 'Output' };

@Component({
  selector: 'docs-output',
  imports: [DocPage, RouterLink, CodeBlock, Callout],
  template: `
    <docs-page
      [title]="'Output'"
      [lede]="'The terminal summary, the Markdown and HTML reports, and how color and config change what you see.'"
    >
      @for (paragraph of outputIntro; track paragraph) {
        <p>{{ paragraph }}</p>
      }
      <p>
        The <a href="/#sample">sample</a> on the landing page is the default printout.
        <a routerLink="/docs/colors">Colors</a> recolors it.
      </p>

      <h2 id="markdown-report">Markdown report</h2>
      <ul class="list-disc space-y-2 pl-5">
        @for (item of reportSections; track item) {
          <li>{{ item }}</li>
        }
      </ul>
      <docs-callout variant="note" label="Excerpt">
        <p>{{ excerptNote }}</p>
      </docs-callout>
      <docs-code-block [code]="markdownExcerpt" label="angular-doctor-report.md" lang="md" />

      <h2 id="html-report">HTML report</h2>
      <p>
        Pass <code>--html</code>, or add <code>"html"</code> to <code>reportFormats</code> in
        config, and the scan also writes <code>angular-doctor-report.html</code> next to the
        Markdown report. One self-contained file: score, severity totals, and findings grouped once
        per rule. Category tabs switch views. The Show select filters to errors, warnings, or info,
        and tab counts update to match. Reference links open in a new tab.
      </p>

      <h2 id="skipped-checks">Skipped checks</h2>
      <p>
        A check that cannot finish on one file is skipped. The summary still prints, and the other
        files are still scanned. Each skip is a path in your project, then the reason:
      </p>
      <docs-code-block [code]="skippedExample" label="terminal" lang="text" />
      <p>{{ skippedHelp }}</p>

      <h2 id="where-the-file-goes">Where the file goes</h2>
      <p>{{ configHelp }}</p>
      <docs-code-block [code]="configExample" label="angular-doctor.config.json" lang="json" />
    </docs-page>
  `,
})
export default class DocsOutput {
  protected readonly outputIntro = outputIntro;
  protected readonly reportSections = reportSections;
  protected readonly excerptNote = excerptNote;
  protected readonly markdownExcerpt = markdownExcerpt;
  protected readonly configExample = configExample;
  protected readonly configHelp = configHelp;
  protected readonly skippedExample = `Skipped checks
  scripts/lib/emit.ts: Invalid regular expression: /\\b\${names.join('\\b/g: Unterminated group`;
  protected readonly skippedHelp =
    "Open that path. The same lines are under Skipped checks in the report, and in the skippedChecks array when you pass --json. The scan reads strings and comments as text. Search the reported file for import { inside a quote or a comment. A name that is not an identifier, such as ${names.join(', ')}, is one shape that does this. The path in the message is the file to open.";
}
