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

@Component({
  selector: 'docs-output',
  imports: [DocPage, RouterLink, CodeBlock, Callout],
  template: `
    <docs-page
      [title]="'Output'"
      [lede]="'The terminal summary, the Markdown report, and how color and config change what you see.'"
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
