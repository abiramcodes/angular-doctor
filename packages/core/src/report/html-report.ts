import { CATEGORIES, type Category, type ProjectInfo, type ScanResult } from '../types.js';
import {
  groupByCategory,
  groupDiagnostics,
  relativeFile,
  type DiagnosticGroup,
} from './group-diagnostics.js';

export type HtmlPalette = 'default' | 'pastel' | 'velvet';

const PALETTES: Record<HtmlPalette, { error: string; warning: string; info: string; ok: string }> =
  {
    default: { error: '#e5484d', warning: '#f5a524', info: '#3e9bcf', ok: '#3ecf8e' },
    pastel: { error: '#f4a7b9', warning: '#f6c59a', info: '#93d2ea', ok: '#98d6b6' },
    velvet: { error: '#ff6363', warning: '#d78ec1', info: '#a48cd9', ok: '#9495e6' },
  };

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function verdict(score: number): string {
  if (score >= 90) return 'Healthy';
  if (score >= 70) return 'Good, with findings to clear';
  if (score >= 40) return 'Needs attention';
  return 'Critical';
}

function toneFor(score: number): 'ok' | 'warning' | 'error' {
  if (score >= 70) return 'ok';
  if (score >= 40) return 'warning';
  return 'error';
}

function groupHtml(group: DiagnosticGroup, projectRoot: string): string {
  const locations = group.items
    .map((d) => {
      const where = `${relativeFile(d.file, projectRoot)}:${d.line}:${d.column}`;
      const detail =
        group.messagesVary && d.message !== group.message
          ? ` <span class="detail">${esc(d.message)}</span>`
          : '';
      return `<li><code>${esc(where)}</code>${detail}</li>`;
    })
    .join('');
  const suggestion = group.suggestion
    ? `<p class="fix"><span class="fix-label">Fix</span> ${esc(group.suggestion)}</p>`
    : '';
  const docs = group.docsUrl
    ? `<p class="docs"><a href="${esc(group.docsUrl)}" target="_blank" rel="noreferrer">Reference</a></p>`
    : '';
  const count = `×${group.items.length} in ${group.fileCount} file${group.fileCount === 1 ? '' : 's'}`;
  return `<article class="group" data-severity="${group.severity}">
<header class="group-head">
<span class="sev sev-${group.severity}"><span class="dot" aria-hidden="true"></span>${group.severity}</span>
<h3 class="rule"><code>${esc(group.ruleId)}</code></h3>
<span class="count">${count}</span>
</header>
<p class="message">${esc(group.message)}</p>${suggestion}${docs}
<ul class="locations">${locations}</ul>
</article>`;
}

export function buildHtmlReport(
  result: Omit<ScanResult, 'reportPath'>,
  project: ProjectInfo,
  palette: HtmlPalette = 'default',
): string {
  const colors = PALETTES[palette] ?? PALETTES.default;
  const byCategory = groupByCategory(result.diagnostics);
  const all = groupDiagnostics(result.diagnostics);
  const score = Math.round(result.score);
  const tone = toneFor(score);
  const total = result.diagnostics.length;
  const segment = (count: number): string =>
    total === 0 ? '0' : String(Math.round((count / total) * 1000) / 10);
  const generated = new Date().toISOString();

  const tabs: { id: string; label: string; count: number; groups: DiagnosticGroup[] }[] = [
    { id: 'all', label: 'All', count: total, groups: all },
    ...CATEGORIES.map((category: Category) => ({
      id: category,
      label: category,
      count: result.totals.byCategory[category],
      groups: byCategory.get(category) ?? [],
    })),
  ];
  const tabButtons = tabs
    .map(
      (tab, index) =>
        `<button role="tab" id="tab-${tab.id}" aria-selected="${index === 0}" aria-controls="pane-${tab.id}" data-tab="${tab.id}"${index === 0 ? '' : ' tabindex="-1"'}>${esc(tab.label)} <span class="tab-count">(${tab.count})</span></button>`,
    )
    .join('');
  const panes = tabs
    .map((tab, index) => {
      const body =
        tab.groups.length === 0
          ? '<p class="empty">No findings here. Nothing to fix in this view.</p>'
          : tab.groups.map((group) => groupHtml(group, project.root)).join('\n') +
            '<p class="empty filter-empty" hidden>No findings match the selected severity.</p>';
      return `<section role="tabpanel" id="pane-${tab.id}" aria-labelledby="tab-${tab.id}" tabindex="0"${index === 0 ? '' : ' hidden'}><h2 class="sr-only">${esc(tab.label)} findings</h2>${body}</section>`;
    })
    .join('\n');
  const skipped =
    result.skippedChecks.length > 0
      ? `<section class="skipped" aria-labelledby="skipped-title"><h2 id="skipped-title">Skipped checks</h2><ul>${result.skippedChecks.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>`
      : '';
  const distribution =
    total === 0
      ? ''
      : `<div class="dist" role="img" aria-label="Findings by severity: ${result.totals.error} errors, ${result.totals.warning} warnings, ${result.totals.info} notes">
<span class="dist-seg dist-error" style="width:${segment(result.totals.error)}%"></span><span class="dist-seg dist-warning" style="width:${segment(result.totals.warning)}%"></span><span class="dist-seg dist-info" style="width:${segment(result.totals.info)}%"></span>
</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Angular Doctor — ${esc(project.name)} (${score}/100)</title>
<style>
:root{
  --error:${colors.error};--warning:${colors.warning};--info:${colors.info};--ok:${colors.ok};
  --score:var(--${tone});
  --bg:#0d0f0e;--surface:#121413;--ink:#eceeed;--body:#c9cdc9;--muted:#9aa39c;--line:#262926;--line-soft:#1b1e1c;
  --focus:#7cc7ff;
}
@media (prefers-color-scheme:light){
  :root{--bg:#f7f7f5;--surface:#fff;--ink:#161816;--body:#333733;--muted:#5c625c;--line:#dcdedb;--line-soft:#e8e9e7;--focus:#0b5cad}
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{margin:0;background:var(--bg);color:var(--body);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
.skip{position:absolute;left:1rem;top:-4rem;background:var(--ink);color:var(--bg);padding:.5rem 1rem;border-radius:6px;z-index:10}
.skip:focus{top:1rem}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:2px}
main{max-width:880px;margin:0 auto;padding:0 1.25rem 4rem}
.masthead{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;padding:1.1rem 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{color:var(--ink);font-weight:650;letter-spacing:-.01em}
.brand .doctor{color:var(--ok)}
.generated{color:var(--muted);font-size:.85rem}
.hero{padding:2.2rem 0 1.6rem;border-bottom:1px solid var(--line)}
.score-row{display:flex;align-items:flex-end;gap:1.1rem;flex-wrap:wrap}
.score{color:var(--ink);font-size:clamp(3.4rem,9vw,5.2rem);font-weight:700;line-height:.95;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.score small{font-size:.32em;font-weight:550;color:var(--muted);letter-spacing:0}
.verdict{color:var(--ink);font-size:1.15rem;font-weight:600;padding-bottom:.7rem}
.meta{color:var(--muted);margin:.9rem 0 0;font-size:.92rem}
.meta b{color:var(--body);font-weight:600}
.meter{height:3px;background:var(--line);margin:1.4rem 0 0}
.meter>i{display:block;height:100%;width:0;background:var(--score)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1px;background:var(--line-soft);border:1px solid var(--line-soft);margin:1.6rem 0 0}
.stat{background:var(--surface);padding:.9rem 1rem}
.stat dt{color:var(--muted);font-size:.82rem;margin:0}
.stat dd{color:var(--ink);font-size:1.45rem;font-weight:650;margin:.15rem 0 0;font-variant-numeric:tabular-nums;line-height:1.1}
.stat dd small{font-size:.8rem;color:var(--muted);font-weight:500}
.dist{display:flex;height:6px;background:var(--line-soft);margin:1rem 0 0;overflow:hidden}
.dist-seg{display:block;height:100%}
.dist-error{background:var(--error)}.dist-warning{background:var(--warning)}.dist-info{background:var(--info)}
.legend{display:flex;gap:1.2rem;flex-wrap:wrap;color:var(--muted);font-size:.85rem;margin:.55rem 0 0;padding:0;list-style:none}
.legend .dot{margin-right:.4rem}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor;flex-shrink:0}
.sev-error{color:var(--error)}.sev-warning{color:var(--warning)}.sev-info{color:var(--info)}
.tabs{position:sticky;top:0;background:var(--bg);z-index:5;padding-top:1.4rem}
.filter-row{display:flex;align-items:center;gap:.6rem;padding-bottom:.65rem}
.filter-row label{color:var(--muted);font-size:.92rem}
.filter-row select{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:.45rem .6rem;font:inherit;font-size:.95rem;cursor:pointer}
select:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
[role=tablist]{display:flex;gap:.2rem;flex-wrap:wrap;border-bottom:1px solid var(--line)}
[role=tab]{background:none;border:0;border-bottom:2px solid transparent;color:var(--muted);padding:.6rem .7rem;margin-bottom:-1px;cursor:pointer;font:inherit;font-size:.95rem;transition:color .15s ease,border-color .15s ease}
[role=tab]:hover{color:var(--ink)}
[role=tab][aria-selected=true]{color:var(--ink);border-bottom-color:var(--ok);font-weight:600}
.tab-count{color:var(--muted);font-variant-numeric:tabular-nums;font-weight:400}
[role=tabpanel]{padding-top:.4rem}
[role=tabpanel]:focus-visible{outline-offset:4px}
.group{padding:1.25rem 0 1.35rem;border-bottom:1px solid var(--line-soft);content-visibility:auto;contain-intrinsic-size:auto 180px}
.group-head{display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}
.sev{display:inline-flex;align-items:center;gap:.45rem;font-size:.85rem;font-weight:600;min-width:5.2rem}
.rule{margin:0;font-size:1rem;min-width:0}
.rule code{overflow-wrap:anywhere}
.count{margin-left:auto;color:var(--muted);font-size:.88rem;font-variant-numeric:tabular-nums;white-space:nowrap}
.message{color:var(--ink);margin:.55rem 0 0;max-width:68ch;text-wrap:pretty}
.fix{margin:.5rem 0 0;max-width:68ch}
.fix-label{color:var(--ok);font-weight:650}
.docs{margin:.45rem 0 0;font-size:.92rem}
a{color:var(--info)}
.locations{margin:.7rem 0 0;padding:0;list-style:none;color:var(--muted);font-size:.9rem}
.locations li{padding:.18rem 0;min-width:0}
.locations code{overflow-wrap:anywhere}
.detail{color:var(--body)}
.empty{color:var(--muted);padding:2rem 0}
.skipped{border-top:1px solid var(--line);margin-top:2rem;padding-top:1.2rem}
.skipped h2,.how h2{color:var(--ink);font-size:1.05rem;margin:0 0 .6rem;scroll-margin-top:5rem}
.skipped ul{margin:0;padding-left:1.1rem;color:var(--muted)}
.how{border-top:1px solid var(--line);margin-top:2rem;padding-top:1.2rem;color:var(--muted);font-size:.92rem;max-width:68ch}
.how p{margin:.4rem 0}
code{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.88em}
@media (max-width:560px){.count{margin-left:0}.sev{min-width:0}.score-row{gap:.7rem}}
</style>
</head>
<body>
<a class="skip" href="#findings">Skip to findings</a>
<main>
<header class="masthead">
<span class="brand">Angular <span class="doctor">Doctor</span></span>
<span class="generated">Generated <time datetime="${generated}">${generated.slice(0, 10)}</time></span>
</header>

<section class="hero" aria-labelledby="project-title">
<h1 id="project-title" class="verdict">${esc(project.name)} — ${esc(verdict(score))}</h1>
<div class="score-row"><span class="score">${score}<small> / 100</small></span></div>
<div class="meter" role="img" aria-label="Health score ${score} out of 100"><i style="width:${score}%"></i></div>
<p class="meta">Angular <b>${esc(project.angularVersion ?? 'unknown')}</b> · ${esc(project.kind)} workspace · <b>${result.filesScanned}</b> files scanned in <b>${result.durationMs}&nbsp;ms</b></p>
<dl class="stats">
<div class="stat"><dt>Errors</dt><dd>${result.totals.error}</dd></div>
<div class="stat"><dt>Warnings</dt><dd>${result.totals.warning}</dd></div>
<div class="stat"><dt>Notes</dt><dd>${result.totals.info}</dd></div>
<div class="stat"><dt>Rules triggered</dt><dd>${all.length}</dd></div>
<div class="stat"><dt>Files with findings</dt><dd>${new Set(result.diagnostics.map((d) => d.file)).size}<small> of ${result.filesScanned}</small></dd></div>
</dl>
${distribution}
<ul class="legend" aria-label="Severity legend">
<li><span class="sev sev-error"><span class="dot" aria-hidden="true"></span>error</span></li>
<li><span class="sev sev-warning"><span class="dot" aria-hidden="true"></span>warning</span></li>
<li><span class="sev sev-info"><span class="dot" aria-hidden="true"></span>info</span></li>
</ul>
</section>

<div class="tabs" id="findings" tabindex="-1">
<div class="filter-row">
<label for="severity-filter">Show</label>
<select id="severity-filter" name="severity" autocomplete="off">
<option value="all" selected>All severities</option>
<option value="error">Errors only</option>
<option value="warning">Warnings only</option>
<option value="info">Info only</option>
</select>
</div>
<div role="tablist" aria-label="Finding categories">${tabButtons}</div>
</div>
${panes}
${skipped}
<section class="how" aria-labelledby="how-title">
<h2 id="how-title">How the score works</h2>
<p>An error costs 1.5 points in each file where its rule fires. A warning costs 0.75 once per rule. Notes do not lower the score. Fix errors first, then re-run <code>npx @abiramcodes/angular-doctor@latest</code>.</p>
</section>
</main>
<script>
const severityFilter=document.getElementById('severity-filter');
severityFilter.addEventListener('change',()=>{
  const wanted=severityFilter.value;
  for(const pane of document.querySelectorAll('[role=tabpanel]')){
    let visible=0;
    let findings=0;
    for(const group of pane.querySelectorAll('.group')){
      const show=wanted==='all'||group.dataset.severity===wanted;
      group.hidden=!show;
      if(show){visible+=1;findings+=group.querySelectorAll('.locations li').length;}
    }
    const empty=pane.querySelector('.filter-empty');
    if(empty) empty.hidden=visible!==0;
    const tab=document.getElementById('tab-'+pane.id.slice('pane-'.length));
    const counter=tab?tab.querySelector('.tab-count'):null;
    if(counter) counter.textContent='('+findings+')';
  }
});
const tabs=[...document.querySelectorAll('[role=tab]')];
function select(tab,focus){
  for(const t of tabs){
    const on=t===tab;
    t.setAttribute('aria-selected',String(on));
    t.tabIndex=on?0:-1;
    document.getElementById('pane-'+t.dataset.tab).hidden=!on;
  }
  if(focus) tab.focus();
}
for(const tab of tabs){
  tab.addEventListener('click',()=>select(tab,false));
  tab.addEventListener('keydown',(event)=>{
    const i=tabs.indexOf(tab);
    let next=null;
    if(event.key==='ArrowRight') next=tabs[(i+1)%tabs.length];
    if(event.key==='ArrowLeft') next=tabs[(i-1+tabs.length)%tabs.length];
    if(event.key==='Home') next=tabs[0];
    if(event.key==='End') next=tabs[tabs.length-1];
    if(next){event.preventDefault();select(next,true);}
  });
}
</script>
</body>
</html>
`;
}
