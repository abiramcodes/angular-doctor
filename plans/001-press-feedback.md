# 001 — Extend the existing press nudge to the other controls

- **Status**: DONE
- **Commit**: 9375f38
- **Severity**: MEDIUM
- **Category**: Missed opportunities (press feedback)
- **Estimated scope**: 1 file, about 15 lines

## Problem

Copy buttons already nudge on press. The other controls do not, so a click on the primary actions feels dead next to copy.

The working recipe is inside `@media (prefers-reduced-motion: no-preference)` in `apps/docs/src/styles.css`:

```css
/* apps/docs/src/styles.css:538 — current */
.press {
  transition: transform 120ms var(--ease-out);
}

.press:active {
  transform: translateY(1px);
}
```

These controls have hover styles and no `:active` transform:

- `apps/docs/src/styles.css:389` `.btn` (theme toggle in `apps/docs/src/app/app.ts:42`, landing links in `apps/docs/src/app/home/landing.ts:294` and `:302`, 404 links in `apps/docs/src/app/pages/[...not-found].page.ts:18`)
- `apps/docs/src/styles.css:771` `.replay` (`apps/docs/src/app/home/landing.ts:104`)
- `apps/docs/src/styles.css:1506` `.terminal-replay` (`apps/docs/src/app/home/terminal-sample.ts:26`)
- `apps/docs/src/styles.css:2256` `.palette-switch-btn` (`apps/docs/src/app/home/landing-colors.ts:25`)

Do not switch this site to the generic audit press (`transform: scale(0.97)` over `160ms`). This repo already settled press as a 1px nudge at 120ms. 120ms is inside the 100–160ms press budget. Adding a second press language is out of scope.

## Target

In the same `@media (prefers-reduced-motion: no-preference)` block, immediately after `.press:active`, add:

```css
/* target — apps/docs/src/styles.css, inside the no-preference block that already holds .press */
.btn,
.replay,
.terminal-replay,
.palette-switch-btn {
  transition: transform 120ms var(--ease-out);
}

.btn:active,
.replay:active,
.terminal-replay:active,
.palette-switch-btn:active {
  transform: translateY(1px);
}
```

Values, spelled out:

- Duration: `120ms` (the same literal `.press` uses). Token `--dur-1` is also `120ms`. Do not retokenize `.press`.
- Easing: `var(--ease-out)`, defined at `apps/docs/src/styles.css:17` as `cubic-bezier(0.23, 1, 0.32, 1)`.
- Property: `transform` only. Do not use `transition: all`. Do not animate `background-color` or `color` in this plan.
- Distance: `translateY(1px)`. Not `scale(0.97)`.

## Repo conventions to follow

Tokens live at the top of `apps/docs/src/styles.css`:

```css
/* apps/docs/src/styles.css:17 */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--dur-1: 120ms;
--dur-2: 180ms;
```

Exemplar to copy, not restyle: `.press` / `.press:active` at `apps/docs/src/styles.css:538`. New rules go in that same `prefers-reduced-motion: no-preference` block so reduced-motion users never receive the nudge. The later global reduce block at `apps/docs/src/styles.css:2415` is a second net; do not edit it.

## Steps

1. Open `apps/docs/src/styles.css`. Confirm `.press` and `.press:active` still match the excerpt above. If they do not, STOP.
2. Paste the target rules immediately after `.press:active`, still inside the `@media (prefers-reduced-motion: no-preference)` block that starts near line 506. Do not add a new media query.
3. Do not add the class `press` in any template. The selectors above are enough.
4. If `.palette-switch-btn` already has a `transition` that lists `background-color` and `color` (plan 002 ran first), do not replace that declaration with transform-only. Merge transform into it:

```css
.palette-switch-btn {
  transition:
    transform 120ms var(--ease-out),
    background-color var(--dur-2) var(--ease-out),
    color var(--dur-2) var(--ease-out);
}
```

Keep `:active { transform: translateY(1px); }` on `.palette-switch-btn` either way.

## Boundaries

- Do NOT touch scan keyframes (`line-in`, `bar-in`, `meter-in`, `veil-out`, `blink`), theme view transitions, nav-link transitions, or command-row transitions.
- Do NOT change markup, copy, or colors.
- Do NOT add dependencies.
- Do NOT animate hover color. Hover stays an instant color change except where plan 002 explicitly transitions palette controls.
- If a step doesn't match the code you find (drift since commit `9375f38`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `rg -n "btn:active|replay:active|terminal-replay:active|palette-switch-btn:active" apps/docs/src/styles.css` shows the four `:active` rules inside the `no-preference` block. No `transition: all`. No `scale(0.97)` added by this plan.
- **Feel check**: run the docs app, then:
  - Press and hold a `.btn` (theme toggle, "Open the docs"), `.replay`, `.terminal-replay`, and a palette button. Each moves down 1px and returns on release. Copy buttons still do the same nudge and do not move 2px.
  - Spam-click. The nudge retargets from the current position. It does not restart from a keyframe.
  - In the Animations panel, set playback to 10%. The motion is a 1px `translateY` over 120ms with the ease-out curve, on `transform` only.
  - Rendering panel → `prefers-reduced-motion: reduce`. The nudge does not run.
- **Done when**: those four controls share the `.press` nudge, copy buttons are unchanged, and reduced motion still drops the movement.
