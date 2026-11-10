# Animation plans

Plans for the docs site. Executors start from the file, not from chat.

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| [001](001-press-feedback.md) | Extend the existing press nudge to the other controls | MEDIUM | DONE |
| [002](002-palette-color-transition.md) | Crossfade the palette preview instead of swapping it | LOW | DONE |

## Order

1. `001-press-feedback.md`
2. `002-palette-color-transition.md`

002 depends on 001 only for `.palette-switch-btn`. Both plans edit `apps/docs/src/styles.css`. 002's transition shorthand must keep `transform 120ms var(--ease-out)` on that button so it does not erase the nudge. 001's step 4 covers the case where 002 landed first. No other dependencies.

## Out of scope

Scan replay, cursor blink, theme view transitions, route changes, the 404 mascot, and the copy-button icon swap. Those were considered and left alone.
