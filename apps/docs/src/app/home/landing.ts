import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../reveal';
import { CopyCommand } from './copy-command';
import {
  ciCommand,
  ciCopy,
  diagnostics,
  facts,
  finding,
  hero,
  markdownExcerpt,
  quickCommands,
  reportCopy,
  runCommand,
} from './landing-content';

@Component({
  selector: 'docs-landing',
  host: { class: 'block min-w-0 max-w-full' },
  imports: [RouterLink, CopyCommand, Reveal],
  template: `
    <section class="floor" [class.is-scanning]="scanning()" aria-labelledby="floor-title">
      <div class="shell floor-grid">
        <div class="buffer-pane">
          <h1 id="floor-title" class="floor-title">Your codebase, live.</h1>
          <ol class="buffer" aria-label="Sample scan, drawn as a live code buffer">
            <li class="line">
              <span class="n">01</span>
              <span
                ><span class="kw">const</span> doctor = <span class="fn">scan</span>(<span
                  class="str"
                  >'angular.json'</span
                >);</span
              >
            </li>
            <li class="line">
              <span class="n">02</span>
              <span
                >doctor.<span class="fn">rules</span> = <span class="num">76</span>;
                <span class="com">// six families</span></span
              >
            </li>
            <li class="line is-hot">
              <span class="n">03</span>
              <span
                ><span class="kw">if</span> (hostBindings) <span class="kw">throw</span>&nbsp;<span
                  class="str keep"
                  >'prefer-host-bindings'</span
                >;<span class="cursor" aria-hidden="true"></span
              ></span>
            </li>
            <li class="line">
              <span class="n">04</span>
              <span>doctor.<span class="fn">score</span> = <span class="num">85</span>;</span>
            </li>
            <li class="line">
              <span class="n">05</span>
              <span
                ><span class="fn">write</span>(<span class="str">'angular-doctor-report.md'</span
                >);</span
              >
            </li>
            <li class="line">
              <span class="n">06</span>
              <span class="com">// fix order: migrations → style guide → the rest</span>
            </li>
            <li class="line">
              <span class="n">07</span>
              <span
                ><span class="fn">repeat</span>(doctor.<span class="fn">scan</span>).on(<span
                  class="str"
                  >'--scope changed'</span
                >);</span
              >
            </li>
          </ol>
          <p class="floor-lede">{{ hero.lede }}</p>
          <p class="floor-note">{{ hero.note }}</p>
          <div class="floor-cta">
            <code>{{ runCommand }}</code>
            <div class="floor-cta-row">
              <docs-copy-command tone="quiet" [value]="runCommand" size="sm" text="Copy" />
            </div>
          </div>
        </div>

        <aside class="meter" id="sample" aria-label="Sample scan result">
          <div class="meter-head">
            <span>Master meter</span>
            <span>0—100</span>
            <button
              type="button"
              class="replay"
              aria-label="Replay the sample scan"
              (click)="replay()"
            >
              Replay
            </button>
          </div>
          <p class="meter-score"><span>85</span><small> / 100</small></p>
          <div class="meter-bars" aria-hidden="true">
            @for (bar of bars; track $index) {
              <i [class.is-on]="$index < 17" [style.animation-delay.ms]="$index * 20"></i>
            }
          </div>
          <dl class="meter-counts">
            <div>
              <dt>errors</dt>
              <dd class="ink-magenta">3</dd>
            </div>
            <div>
              <dt>warnings</dt>
              <dd class="ink-amber">27</dd>
            </div>
            <div>
              <dt>notes</dt>
              <dd class="ink-green">6</dd>
            </div>
          </dl>
          <p class="meter-meta">76 checks · 299 ms · Angular 22.2</p>
          <div class="meter-finding">
            <span class="meter-finding-k">Sample error · 1 of 3</span>
            <code>{{ finding.rule }}</code>
            <p>{{ finding.location }}</p>
          </div>
        </aside>
      </div>
    </section>

    <section class="facts" docsReveal aria-label="What the scan needs and how it scores">
      <div class="shell">
        <ul class="fact-list">
          @for (fact of facts; track fact.label) {
            <li class="fact">
              <p class="fact-value">{{ fact.value }}</p>
              <p class="fact-label">{{ fact.label }}</p>
              <p class="fact-detail">{{ fact.detail }}</p>
            </li>
          }
        </ul>
      </div>
    </section>

    <section class="section" id="diagnostics" docsReveal aria-labelledby="diagnostics-title">
      <div class="shell section-grid">
        <div class="section-body">
          <div class="section-head">
            <h2 id="diagnostics-title" class="section-title">Six families, one meter.</h2>
            <p class="section-lede">
              76 built-in checks in six categories. Each family is a kind of Angular habit the scan
              looks for.
            </p>
          </div>
          <ul class="setlist">
            @for (item of diagnostics; track item.category) {
              <li class="set-row">
                <div class="set-main">
                  <div class="set-head">
                    <h3>{{ item.category }}</h3>
                    <span class="set-count">{{ item.count }}</span>
                  </div>
                  <p class="set-body">{{ item.body }}</p>
                  <p class="set-examples">
                    @for (example of item.examples; track example) {
                      <code>{{ example }}</code>
                    }
                  </p>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>

    <section class="section" id="report" docsReveal aria-labelledby="report-title">
      <div class="shell section-grid">
        <div class="section-body">
          <div class="section-head">
            <h2 id="report-title" class="section-title">The report is the prescription.</h2>
            <p class="section-lede">
              When anything is found, the scan writes angular-doctor-report.md — a self-contained
              brief for you or your agent.
            </p>
          </div>
          <div class="output-grid">
            <div class="output-copy">
              @for (paragraph of reportCopy; track paragraph) {
                <p>{{ paragraph }}</p>
              }
              <div class="finding">
                <p class="diff-label">Error</p>
                <div class="finding-body">
                  <p class="finding-rule">{{ finding.rule }}</p>
                  <p class="finding-loc">{{ finding.location }}</p>
                  <p class="finding-msg">{{ finding.message }}</p>
                </div>
              </div>
              <div class="diff-grid">
                <div class="diff-pane">
                  <p class="diff-label">before</p>
                  <pre><code>{{ finding.before }}</code></pre>
                </div>
                <div class="diff-pane">
                  <p class="diff-label">{{ finding.fixLabel }}</p>
                  <pre><code>{{ finding.after }}</code></pre>
                </div>
              </div>
            </div>
            <figure class="document">
              <figcaption class="document-head">
                <span>angular-doctor-report.md</span>
                <span>sample</span>
              </figcaption>
              <pre class="document-body"><code>{{ markdownExcerpt }}</code></pre>
            </figure>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="commands" docsReveal aria-labelledby="commands-title">
      <div class="shell section-grid">
        <div class="section-body">
          <div class="section-head">
            <h2 id="commands-title" class="section-title">Start with one command.</h2>
            <p class="section-lede">
              Every command accepts --colors default, pastel, or velvet. The full flag reference
              lives in the docs.
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
                <docs-copy-command tone="quiet" [value]="item.command" size="sm" />
              </li>
            }
          </ul>
        </div>
      </div>
    </section>

    <section class="section" id="ci" docsReveal aria-labelledby="ci-title">
      <div class="shell section-grid">
        <div class="section-body">
          <div class="section-head">
            <h2 id="ci-title" class="section-title">Run it where the code lands.</h2>
            <p class="section-lede">{{ ciCopy }}</p>
            <a class="section-link" routerLink="/docs/ci">Set up CI</a>
          </div>
          <div class="ci-command">
            <span class="ci-prompt" aria-hidden="true">$</span>
            <code>{{ ciCommand }}</code>
            <docs-copy-command tone="quiet" [value]="ciCommand" size="sm" />
          </div>
        </div>
      </div>
    </section>

    <section class="close" docsReveal aria-labelledby="close-title">
      <div class="shell section-grid">
        <div class="section-body close-body">
          <h2 id="close-title" class="close-title">Run it on your workspace.</h2>
          <p class="close-lede">Scan the directory you are in.</p>
          <div class="close-actions">
            <div class="ci-command">
              <span class="ci-prompt" aria-hidden="true">$</span>
              <code>{{ runCommand }}</code>
              <docs-copy-command tone="quiet" [value]="runCommand" size="sm" text="Copy" />
            </div>
            <a class="btn btn-outline" routerLink="/docs">Open the docs</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Landing {
  protected readonly hero = hero;
  protected readonly facts = facts;
  protected readonly runCommand = runCommand;
  protected readonly diagnostics = diagnostics;
  protected readonly reportCopy = reportCopy;
  protected readonly finding = finding;
  protected readonly markdownExcerpt = markdownExcerpt;
  protected readonly quickCommands = quickCommands;
  protected readonly ciCommand = ciCommand;
  protected readonly ciCopy = ciCopy;

  protected readonly scanning = signal(false);

  protected readonly bars = Array.from({ length: 20 });

  protected replay(): void {
    this.scanning.set(false);
    requestAnimationFrame(() => requestAnimationFrame(() => this.scanning.set(true)));
  }

  protected pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
