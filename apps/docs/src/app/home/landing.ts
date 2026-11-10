import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Callout } from '../callout';
import { CopyCommand } from './copy-command';
import { TerminalSample } from './terminal-sample';
import {
  ciCommand,
  ciCopy,
  diagnostics,
  finding,
  hero,
  markdownExcerpt,
  pipeline,
  quickCommands,
  reportCopy,
  runCommand,
  sampleCaption,
  type TerminalLine,
} from './landing-content';

@Component({
  selector: 'docs-landing',
  host: { class: 'block min-w-0 max-w-full' },
  imports: [RouterLink, CopyCommand, TerminalSample, Callout],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <div class="shell">
        <div class="hero-grid">
          <div class="min-w-0">
            <h1 id="hero-title" class="hero-title">{{ hero.title }}</h1>
            <p class="hero-lede">{{ hero.lede }}</p>
            <div class="hero-actions">
              <div class="hero-command">
                <span class="hero-command-prompt" aria-hidden="true">$</span>
                <span class="hero-command-text">{{ runCommand }}</span>
                <docs-copy-command tone="ghost" [value]="runCommand" />
              </div>
              <a class="btn btn-outline" routerLink="/docs">Read the docs</a>
            </div>
            <p class="hero-note">{{ hero.note }}</p>
          </div>
          <div class="min-w-0">
            <docs-terminal-sample
              anchor="sample"
              palette="default"
              [lines]="lines"
              [playScan]="true"
              [title]="'angular-doctor — sample'"
              [meta]="'Angular 22.2 · 299 ms'"
              [caption]="sampleCaption"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="diagnostics" aria-labelledby="diagnostics-title">
      <div class="shell">
        <div class="section-head">
          <h2 id="diagnostics-title" class="section-title">Six areas, one score.</h2>
          <p class="section-lede">
            76 built-in checks grouped into six categories. Each rule counts once, at its strongest
            severity — an error costs 1.5 points, a warning 0.75, a note nothing.
          </p>
        </div>
        <table class="diagnostics">
          <caption class="sr-only">
            The six diagnostic categories, their check counts, and example rules
          </caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">What it covers</th>
              <th scope="col">Example checks</th>
            </tr>
          </thead>
          <tbody>
            @for (item of diagnostics; track item.category) {
              <tr>
                <td>
                  <span class="diagnostic-category">
                    {{ item.category }}
                    <span class="diagnostic-count">{{ item.count }}</span>
                  </span>
                </td>
                <td>
                  <p class="diagnostic-body">{{ item.body }}</p>
                </td>
                <td>
                  <span class="diagnostic-examples">
                    @for (example of item.examples; track example) {
                      <code>{{ example }}</code>
                    }
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="section" id="how" aria-labelledby="how-title">
      <div class="shell">
        <div class="section-head">
          <h2 id="how-title" class="section-title">From command to report in four steps.</h2>
          <p class="section-lede">
            The scan is deterministic and fast. It reads source, never runs your app.
          </p>
        </div>
        <ol class="steps">
          @for (step of pipeline; track step.title) {
            <li class="step">
              <span class="step-index">{{ pad($index + 1) }}</span>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-body">{{ step.body }}</p>
            </li>
          }
        </ol>
      </div>
    </section>

    <section class="section" id="report" aria-labelledby="report-title">
      <div class="shell">
        <div class="section-head">
          <h2 id="report-title" class="section-title">The report is the prescription.</h2>
          <p class="section-lede">
            When anything is found, the scan writes angular-doctor-report.md — a self-contained
            brief for you or your agent.
          </p>
        </div>
        <div class="report-grid">
          <div class="report-copy">
            @for (paragraph of reportCopy; track paragraph) {
              <p>{{ paragraph }}</p>
            }
            <docs-callout variant="error" [label]="finding.rule">
              <p class="mono text-sm">{{ finding.location }}</p>
              <p>{{ finding.message }}</p>
            </docs-callout>
            <div class="finding-code">
              <div class="finding-code-pane">
                <p class="finding-code-label">before</p>
                <pre><code>{{ finding.before }}</code></pre>
              </div>
              <div class="finding-code-pane">
                <p class="finding-code-label">{{ finding.fixLabel }}</p>
                <pre><code>{{ finding.after }}</code></pre>
              </div>
            </div>
          </div>
          <figure class="document">
            <figcaption class="document-head">
              <span class="document-title">angular-doctor-report.md</span>
            </figcaption>
            <pre class="document-body"><code>{{ markdownExcerpt }}</code></pre>
          </figure>
        </div>
      </div>
    </section>

    <section class="section" id="commands" aria-labelledby="commands-title">
      <div class="shell">
        <div class="section-head">
          <h2 id="commands-title" class="section-title">Start with one command.</h2>
          <p class="section-lede">
            Every command accepts --colors default, pastel, or velvet. The full flag reference lives
            in the docs.
          </p>
          <a class="section-link" routerLink="/docs/reference">Read the command reference</a>
        </div>
        <ul class="command-list">
          @for (item of quickCommands; track item.command) {
            <li class="command-row">
              <div class="command-row-main">
                <code class="command-row-code">{{ item.command }}</code>
                <p class="command-row-detail">{{ item.detail }}</p>
              </div>
              <docs-copy-command tone="quiet" [value]="item.command" />
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section" id="ci" aria-labelledby="ci-title">
      <div class="shell">
        <div class="section-head">
          <h2 id="ci-title" class="section-title">Run it where the code lands.</h2>
          <p class="section-lede">{{ ciCopy }}</p>
          <a class="section-link" routerLink="/docs/ci">Set up CI</a>
        </div>
        <div class="hero-command">
          <span class="hero-command-prompt" aria-hidden="true">$</span>
          <span class="hero-command-text">{{ ciCommand }}</span>
          <docs-copy-command tone="ghost" [value]="ciCommand" />
        </div>
      </div>
    </section>
  `,
})
export class Landing {
  protected readonly hero = hero;
  protected readonly runCommand = runCommand;
  protected readonly diagnostics = diagnostics;
  protected readonly pipeline = pipeline;
  protected readonly reportCopy = reportCopy;
  protected readonly finding = finding;
  protected readonly markdownExcerpt = markdownExcerpt;
  protected readonly quickCommands = quickCommands;
  protected readonly ciCommand = ciCommand;
  protected readonly ciCopy = ciCopy;
  protected readonly sampleCaption = sampleCaption;

  protected readonly lines: TerminalLine[] = [
    { tokens: [{ text: '$ npx angular-doctor@latest', dim: true }] },
    { tokens: [], meter: { fill: 85, score: '85', tone: 'success' } },
    {
      tokens: [
        { text: '3 errors', role: 'error' },
        { text: '   ', dim: true },
        { text: '27 warnings', role: 'warning' },
        { text: '   ', dim: true },
        { text: '6 notes', role: 'info' },
      ],
    },
    { tokens: [{ text: 'Report: angular-doctor-report.md', role: 'report', strong: true }] },
  ];

  protected pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
