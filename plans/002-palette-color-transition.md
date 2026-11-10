# 002 — Crossfade the palette preview instead of swapping it

- **Status**: DONE
- **Commit**: 9375f38
- **Severity**: LOW
- **Category**: Missed opportunities (jarring state change)
- **Estimated scope**: 1 file, about 20 lines

## Problem

On the colors section, choosing default / pastel / velvet repaints the switch, the swatches, and the sample terminal in one frame. The eye loses which chip changed.

Current rules, with no transition:

```css
/* apps/docs/src/styles.css:2256 — current */
.palette-switch-btn {
  padding: 0.35rem 0.8rem;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
}

.palette-switch-btn:hover {
  color: var(--heading);
}

.palette-switch-btn.is-active {
  background: var(--green);
  color: var(--background);
}
```

```css
/* apps/docs/src/styles.css:2290 — current */
.swatch-chip {
  width: 2rem;
  height: 1rem;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
```

Ink in the sample is an inline color on spans inside `.terminal-body` (`apps/docs/src/app/home/terminal-sample.ts:65`). The meter fill is a span with an inline background (`terminal-sample.ts:45`). Neither has a color transition.

This is an intentional exception to "animate transform and opacity only." The property that changes is the color. A transform cannot bridge it. Do not use `transition: all`.

## Target

Duration `var(--dur-2)`, which is `180ms` at `apps/docs/src/styles.css:19`. Easing `var(--ease-out)`, which is `cubic-bezier(0.23, 1, 0.32, 1)` at `apps/docs/src/styles.css:17`. 180ms is inside the 125–200ms small-popover budget and under the 300ms UI cap.

```css
/* target — .palette-switch-btn keeps a single transition declaration */
.palette-switch-btn {
  padding: 0.35rem 0.8rem;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    transform 120ms var(--ease-out),
    background-color var(--dur-2) var(--ease-out),
    color var(--dur-2) var(--ease-out);
}

.swatch-chip {
  width: 2rem;
  height: 1rem;
  flex-shrink: 0;
  border: 1px solid var(--border);
  transition: background-color var(--dur-2) var(--ease-out);
}

.terminal-body span {
  transition:
    background-color var(--dur-2) var(--ease-out),
    color var(--dur-2) var(--ease-out);
}
```

The `transform 120ms` line on `.palette-switch-btn` is required so this shorthand does not erase the press nudge from plan 001. If plan 001 has not landed, still include that transform line. Press `:active` itself is plan 001's job. This plan does not add `:active` rules.

## Repo conventions to follow

```css
/* apps/docs/src/styles.css:17 */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--dur-1: 120ms;
--dur-2: 180ms;
```

Exemplar of a short color transition already in the file (`apps/docs/src/styles.css:1921`):

```css
.nav-link {
  transition:
    background-color var(--dur-1) var(--ease-out),
    color var(--dur-1) var(--ease-out);
}
```

Match that shape. Use `--dur-2` (180ms), not `--dur-1`, for this palette crossfade. Do not add a new easing token.

Reduced motion is already global (`apps/docs/src/styles.css:2415`): `transition-duration: 0.01ms !important`. Do not add another reduce block.

## Steps

1. Open `apps/docs/src/styles.css`. Confirm `.palette-switch-btn` and `.swatch-chip` still match the excerpts above. If they do not, STOP.
2. Add the `transition` lines to `.palette-switch-btn` and `.swatch-chip` as in the target. If `.palette-switch-btn` already has `transition: transform 120ms var(--ease-out)` from plan 001, replace that declaration with the three-line transition in the target. Leave any `.palette-switch-btn:active { transform: translateY(1px); }` rule in place.
3. Add `.terminal-body span` with the target transition. Put it next to the other `.terminal-body` rules (the block that starts near `apps/docs/src/styles.css:1535`). Do not put it inside the scan `@keyframes`.
4. Do not change `landing-colors.ts` or `terminal-sample.ts`. Inline `style.color` and `style.background` updates are what the transition interpolates.

## Boundaries

- Do NOT touch scan animations (`line-in`, `meter-in`, `veil-out`), the cursor blink, or `.press`.
- Do NOT transition `width` on `.terminal-fill`. Width is a layout property. Only `background-color` and `color`.
- Do NOT use `transition: all`.
- Do NOT change palette hexes, swatch markup, or which button is active.
- If a step doesn't match the code you find (drift since commit `9375f38`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `rg -n "palette-switch-btn|swatch-chip|terminal-body span" apps/docs/src/styles.css` shows `var(--dur-2)` and `var(--ease-out)` on those rules, and `.palette-switch-btn` has exactly one `transition` (transform 120ms plus background-color and color at `--dur-2`). No `transition: all`.
- **Feel check**: open the docs colors section and click between default, pastel, and velvet.
  - The active pill's fill and label blend over about 180ms. The previous pill blends back. They do not pop.
  - Each swatch chip's fill blends. The chip does not move or resize.
  - Syntax colors and the health-meter fill in the sample terminal blend. The scan veil does not replay just because the palette changed.
  - Click a palette button twice quickly. The color retargets from the in-between value. It does not jump back to the start and replay.
  - Hold a palette button. It still nudges 1px if plan 001 has landed. The nudge stays 120ms and does not stretch to 180ms.
  - Animations panel at 10% playback: only `background-color` and `color` run for ~180ms on the chips and terminal spans.
  - `prefers-reduced-motion: reduce`: colors swap with no visible blend (the global 0.01ms duration).
- **Done when**: switching palettes blends the pill, the chips, and the sample ink, and the press nudge on the pill is still 120ms on `transform` alone.
