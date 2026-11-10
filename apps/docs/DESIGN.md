---
name: Angular Doctor
description: A health scan for Angular and Nx workspaces, presented as a live code buffer.
colors:
  signal-blue: "#698BD3"
  signal-blue-paper: "#2D54A1"
  signal-blue-ref: "#3366CC"
  lamp-red: "#FF3036"
  lamp-red-paper: "#962B31"
  hazard-orange: "#F55B1D"
  cursor-gold: "#E0AF46"
  cursor-gold-paper: "#5F4E29"
  black: "#1A1A1A"
  panel-ink: "#221C1D"
  instrument: "#0E0E0E"
  metal: "#D2D4E1"
  metal-white: "#EDEDED"
  metal-mid: "#666666"
  dim: "#8C8D95"
  hairline: "#343434"
  line-strong: "#666666"
  cream: "#E3CFAA"
  cream-card: "#E8DECC"
  burgundy: "#5E292F"
  paper-dim: "#634E50"
typography:
  root:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.9rem + 0.18vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.75
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(2.35rem, 1.5rem + 3.6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.1em"
rounded:
  flat: "0px"
  control: "2px"
  status: "50%"
spacing:
  xs: "0.35rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2.5rem"
  section: "clamp(3rem, 6vw, 4.75rem)"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.black}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.6rem"
  button-outline:
    backgroundColor: "{colors.black}"
    textColor: "{colors.metal}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.6rem"
  nav-link-active:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.lamp-red}"
    typography: "{typography.label}"
  meter-panel:
    backgroundColor: "{colors.panel-ink}"
    textColor: "{colors.metal}"
    rounded: "{rounded.flat}"
    padding: "1rem 1.1rem"
---

# Design System: Angular Doctor

## Overview

**Creative North Star: "The Live Buffer"**

The site is a code buffer at stage scale. Source enters, findings come out, and the score sits on a master meter. The six families are listed once, under the floor, with what each one checks. Nothing is dressed as a marketing page: the file tab, line numbers, syntax colour, cursor, and meter are the page's actual parts, and they keep working as navigation, copy controls, and reading structure.

The system is flat, square, and high-contrast. Broadcast black is the room. Exactly three inks carry meaning — signal blue for health and primary action, lamp red for strings, active state, and errors, cursor gold for warnings and the cursor. Running prose switches to a workhorse sans so the Read surfaces stay comfortable; code, numbers, and labels stay monospaced because they are code, numbers, and labels, not costume.

The light theme is the same buffer on cream paper: black ink, burgundy for secondary text, the same three hues darkened for contrast, while code and instrument panels stay on the night palette. The world is committed on the landing and held with restraint across docs, changelog, and the 404.

**Key Characteristics:**

- Broadcast-black ground with hairline rules and square panels.
- Three functional inks: signal blue, lamp red, cursor gold. No gradients, no glow halos.
- Monospace for stage lines and measurements; Public Sans for long reading.
- The hero is a working code buffer plus a score meter, not a headline over a screenshot.
- Angie appears only on the 404, as a stage character.

## Colors

**Signal Room.** Night is a broadcast set: black `#1A1A1A`, metal text `#D2D4E1` and `#EDEDED`, signal blue, lamp red `#FF3036`, cursor gold `#E0AF46`. Day is cream paper `#E3CFAA` with burgundy `#5E292F` for secondary text. Panels at night pick up a little burgundy so the room is warm metal, not a flat gray. Hazard orange `#F55B1D` sits in the lamp-red ramp only. It is not a fourth ink.

CSS names stay `--green`, `--magenta`, and `--amber`. Components do not change when the values change.

Reference blue `#3366CC` is 3.24:1 on `#1A1A1A`, so the night health ink is that blue lifted 34% toward metal `#D2D4E1`. Cream is too light for the raw lamp and gold, so those paper inks are the same hues darkened until small text and the tinted washes clear 4.5:1.

### Primary

- **Signal Blue** (`#698BD3`): health score, primary buttons, lane cells, focus ring on the night stage. `#3366CC` mixed 34% toward `#D2D4E1`. 5.17:1 on black, 4.98:1 on the panel, 5.17:1 for black labels on the fill.
- **Signal Blue, paper** (`#2D54A1`): the same role on cream. `#3366CC` mixed 24% toward black. 4.76:1 on cream, including cream labels on the fill.

### Secondary

- **Lamp Red** (`#FF3036`): syntax, active navigation, links, errors, selection. Reference swatch. 4.75:1 on black, 4.58:1 on the burgundy panel.
- **Lamp Red, paper** (`#962B31`): the same role on cream. `#FF3036` mixed 65% toward burgundy `#5E292F`. 5.13:1 on cream, 4.58:1 on the 8% active wash.

### Tertiary

- **Cursor Gold** (`#E0AF46`): warnings, the cursor, and the hot buffer line. Reference swatch. 8.61:1 on black.
- **Cursor Gold, paper** (`#5F4E29`): the same role on cream. `#E0AF46` mixed 65% toward black. 5.28:1 on cream, 4.67:1 on the 9% hot-line wash.

### Neutral

- **Broadcast Black** (`#1A1A1A`): night canvas. Also cream body, headings, and foreground.
- **Panel** (`#221C1D`): night cards. Black mixed 12% toward burgundy.
- **Instrument** (`#0E0E0E`): code and terminal panels in both themes. Darker than the canvas. Daylight keeps this ground.
- **Metal** (`#D2D4E1`): night body text. Reference swatch. 11.81:1 on black.
- **Metal white** (`#EDEDED`): night headings. Reference swatch. 14.87:1 on black.
- **Metal mid** (`#666666`): night strong rules, and empty meter cells on cream. Reference swatch. 3.03:1 on black as a rule. 4.31:1 as meter-off on the cream card.
- **Dim** (`#8C8D95`): night metadata. Metal mixed toward black. 5.27:1 on black, 5.85:1 on the instrument.
- **Muted text, night** (`#A6A7B1`): ledes and instrument metadata. Lighter metal. 7.28:1 on black.
- **Hairline** (`#343434`): night borders and the instrument rule. Black mixed toward `#666666`.
- **Burgundy** (`#5E292F`): cream secondary text. Reference swatch. 7.51:1 on cream. Also the pigment in the night panel.
- **Cream** (`#E3CFAA`): day canvas. Reference swatch.
- **Cream card** (`#E8DECC`): day panels. Cream lifted halfway toward `#EDEDED`.
- **Paper dim** (`#634E50`): day metadata. `#666666` mixed 40% toward burgundy. 5.03:1 on cream.
- **Paper strong line** (`#9B7568`): day meter and control borders. Cream mixed 54% toward burgundy.
- **Meter off, night** (`#767778`): empty meter cells. Metal mid lifted toward `#D2D4E1`. 3.74:1 on the night panel.

### Named Rules

**The Three Inks Rule.** Signal blue, lamp red, and cursor gold are the only chromatic inks. Hazard orange stays inside the lamp ramp. Neutrals, borders, and dim text are derived from the reference metal, black, burgundy, and cream. A fourth hue is a bug.

**The No Glow Rule.** Nothing glows. Emphasis comes from solid fill, a hard 1px rule, or a scale step. The only circles are 6px status LEDs and the mascot's own artwork.

**The House Lights Rule.** Light mode is not an inversion. It is cream paper from the same reference set. Code and instrument panels stay on the night palette.

## Typography

**Display Font:** JetBrains Mono (with ui-monospace, Menlo)
**Body Font:** Public Sans (with ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono

**Character:** A terminal voice at stage scale for the world, and a calm public-service sans for the reading. The pairing keeps the product's technical surface loud and the documentation quiet.

### Hierarchy

- **Display** (700, clamp 2.35rem–4.75rem, 0.94, −0.04em): landing headline only, two lines maximum.
- **Headline** (500, clamp 1.85rem–2.9rem, 1.04, −0.035em): section titles on the landing and docs page titles.
- **Title** (500, 1.05rem, 1.15): setlist categories, chain steps, docs subheads.
- **Body** (400, 1rem, 1.75): running prose, capped near 65 characters per line on docs.
- **Label** (400, 0.6875rem, 1.6, 0.1em, uppercase): line numbers, metadata, buttons, navigation.

### Named Rules

**The Mono-For-Data Rule.** Monospace is used for code, commands, counts, scores, line numbers, and labels. It never sets a paragraph of prose.

**The One Display Rule.** Only the landing headline uses the display step. Docs titles step down to the headline size.

## Layout

The shell is 78rem wide with fluid 1.15–2.75rem gutters. The landing opens as a two-column floor: buffer, lede, and the command on the left, a 21rem master meter on the right. Below the floor, a four-fact strip (runtime, workspace walk, scopes, scoring) then sections with a hairline top rule and clamp(3rem, 6vw, 4.75rem) vertical padding. The sample score appears on the meter only.

Docs use a 13.5rem sidebar, a reading column capped at 40rem, and a 12rem on-this-page rail from 1200px up. Quickstart, header rule, pager, and prose share the same 40rem measure. Below 1024px the sidebar becomes wrapped pills; below 980px the floor collapses to one column and a compact command block appears in the first screen; below 640px buffer lines wrap at spaces and long strings stay whole.

Spacing rhythm: 0.35rem inside a line group, 0.75rem between controls, 1.25rem inside a block, 2.5rem between blocks, and 3–4.75rem between sections. More space sits above a heading than below it.

## Elevation & Depth

The system is flat. Depth is expressed with tonal steps (black → panel ink → hairline) and 1px borders, never with shadow or blur. The single exception is the 404 mascot, which carries a neutral offset drop shadow so the character sits in front of the stage. There are no glass surfaces, no backdrop filters, and no coloured halos.

### Named Rules

**The Border-Not-Shadow Rule.** If a surface needs separation, add a 1px hairline or move it one tonal step. Do not add a shadow.

## Shapes

Controls and panels are square: 2px on buttons and copy controls, 0 elsewhere. Borders are always 1px and never colored on one side only. The only round forms are 6px status LEDs, the terminal's three chrome dots, and Angie's artwork. Cards, radii above 2px, and pill-shaped containers are not part of the world.

## Components

### Buttons

- **Shape:** square, 2px corners, 1px border.
- **Primary:** signal-blue fill, black label on the night stage and cream label under house lights, 2.6rem minimum height, 1rem side padding, mono uppercase at 0.75rem.
- **Hover / Focus:** primary mixes toward ink on hover; focus uses a 2px signal-blue ring at 3px offset.
- **Secondary / Ghost:** transparent with a hairline or strong-line border; hover moves the border and text to signal blue.

### Copy control

- **Shape:** 2rem square icon button at rest; a wide variant adds a visible mono label.
- **Primary:** signal-blue fill and black text on the landing meter; quiet variant is transparent with an instrument-tinted border on dark panels.
- **States:** idle copy icon, check icon plus "Copied" or "Copy failed" when labelled, and a visually hidden live region for icon-only use.

### Cards / Containers

- **Corner Style:** 0.
- **Background:** panel ink or broadcast black; cream and cream card under house lights.
- **Border:** 1px hairline; strong line for the meter.
- **Internal Padding:** 0.85–1.1rem.

### Inputs / Fields

- **Style:** 1px hairline, transparent or panel ground, 2px corners.
- **Focus:** 2px signal-blue ring at 3px offset.
- No form fields ship on the public site yet; the command line is a read-only code field.

### Navigation

- Site nav sits in the header as mono uppercase links with a 1px border on hover and a lamp-red border on the active section.
- Docs navigation uses grouped mono labels and Public Sans links; active page is lamp-red text on an 8% lamp-red wash. Mobile collapses groups into wrapping pills.
- Section links use a lamp-red underline with a 4px offset.

### Signature component: Master meter

The hero's right rail is a 21rem panel: a 4.5–6.5rem signal-blue score, a 20-cell bar row, three severity counts, and a first-finding line. The published `npx @abiramcodes/angular-doctor@latest` command sits in the buffer pane beside it.

### Signature component: Code buffer

Seven grid lines with a 2.35rem gutter, syntax inks, one gold hot line with a 2px inset marker, and a blinking cursor. On mobile the lines wrap at spaces; strings that must stay whole carry a `keep` nowrap. It is the first viewport's thesis, not decoration.

## Do's and Don'ts

### Do:

- **Do** keep exactly three chromatic inks and derive every other surface from the reference metal, black, burgundy, and cream. Borders, dim text, and meter-off are tints, not new hues.
- **Do** use JetBrains Mono for code, commands, counts, and labels, and Public Sans for running prose.
- **Do** put the score and the command in the first desktop viewport. State each sample number once.
- **Do** keep docs prose near 40rem and align header, quickstart, pager, and prose to it.
- **Do** use `npx @abiramcodes/angular-doctor@latest` as the primary action. That command runs the published package.
- **Do** confine Angie to the 404 and keep the rest of the site mascot-free.

### Don't:

- **Don't** add gradients, glow shadows, glass, blurred panels, or colored halos.
- **Don't** use radii above 2px on controls or any rounded cards.
- **Don't** use monospace for paragraphs or sans for code.
- **Don't** put an eyebrow or kicker above a heading; the buffer tab and line numbers are chrome, not labels.
- **Don't** introduce a fourth accent for a new feature; give the feature a job inside the three inks.
- **Don't** let the light theme invert code panels; instruments stay dark.
