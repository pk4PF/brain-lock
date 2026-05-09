---
name: Brain Lock
description: A focus app where blocking is a fair trade — earn brain cells by playing games, spend them to unlock the apps you've blocked.
colors:
  background:        "#FFFFFF"
  surface:           "#FFFFFF"
  surface-alt:       "#F5F5F5"
  border-hairline:   "#EBEBEB"
  border-strong:     "#D4D4D4"
  text:              "#111111"
  text-secondary:    "#666666"
  text-muted:        "#AAAAAA"
  accent:            "#E53935"
  accent-deep:       "#C62828"
  accent-tint:       "rgba(229,57,53,0.10)"
  accent-glow:       "rgba(229,57,53,0.18)"
  success:           "#22C55E"
  error:             "#EF4444"
  info:              "#3B82F6"
  dark-background:   "#0D0D0D"
  dark-surface:      "#1A1A1A"
  dark-surface-alt:  "#222222"
  dark-border:       "#2E2E2E"
  dark-text:         "#F5F5F5"
  dark-accent:       "#FF5252"
typography:
  display:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "36"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-1"
  headline:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "28"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.6"
  title:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "20"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.3"
  body:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "15"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-small:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "13"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "11"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "1.6"
  stat:
    fontFamily: "Geist, -apple-system, system-ui, sans-serif"
    fontSize: "36"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-1"
rounded:
  xs: "8"
  sm: "12"
  md: "14"
  lg: "16"
  xl: "20"
  pill: "999"
spacing:
  xs:    "4"
  sm:    "8"
  md:    "12"
  lg:    "16"
  xl:    "24"
  xxl:   "32"
  xxxl:  "40"
  xxxxl: "56"
components:
  button-primary:
    backgroundColor: "{colors.text}"
    textColor: "{colors.background}"
    rounded: "{rounded.pill}"
    height: "44"
    padding: "0 24"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "44"
    padding: "0 24"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "22"
  card-game-tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "14"
  pill-badge-neutral:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "4 10"
    typography: "{typography.label}"
  pill-badge-accent:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "4 10"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    height: "60"
    padding: "0 20"
    typography: "{typography.title}"
  tab-bar:
    backgroundColor: "{colors.surface}"
    height: "84"
    typography: "{typography.label}"
---

## Overview

Brain Lock is an iOS app for breaking phone-addiction loops. The product surface is the in-app experience: five tabs (Home, Block, Games, Stats, Profile), an onboarding flow, individual game screens, and a paywall. The marketing site at `plbtk.com` is a separate surface and is not governed by this document.

The visual system is **restrained, near-monochrome, with one accent**. White surface dominates. Black-tinted-warm text carries the hierarchy. The brand red (`#E53935`) appears only on:

1. Big stat numbers (brain cells, time remaining, streaks).
2. Live-state pills and confirmation badges.
3. The CTA gradient (`#E53935 → #F97316`) reserved for the most important action on a screen.

Everywhere else — borders, dividers, button fills, chrome — uses tinted neutrals. This is deliberate restraint, in the *Restrained* color strategy from Impeccable's spec. It distances Brain Lock from category clichés (wellness pastels, productivity gradients, gamified primary-rainbow) and makes the accent feel earned when it appears.

The system is built in **React Native + Expo**, with **Tamagui** for component primitives and **Geist** as the type face. Game-screen surfaces (`GameShell`) deliberately break to dark immersive themes; the rest of the app stays light. Dark mode is supported across all main tabs but light is the canonical visual.

The grid is implicit: 4pt baseline (the Spacing scale is `4 / 8 / 12 / 16 / 24 / 32 / 40 / 56`). Side padding on screens is **16pt** for content-dense tabs (Games), **20pt** for the rest. Vertical rhythm leans on the Spacing scale, not arbitrary numbers.

## Colors

### Surfaces

The base canvas is `#FFFFFF`. There is no off-white tint at the page level — the tinted neutral comes in at the border and muted-text layer instead. `surface-alt` (`#F5F5F5`) is reserved for inactive states (locked tiles, disabled day pills, empty stat backgrounds).

**Borders carry the structural weight.** `border-hairline` (`#EBEBEB`) is used everywhere the Anvil reference uses gray-200: card outlines, tile outlines, divider rules, input chrome. There is no shadow under cards by default — the hairline is sufficient. `border-strong` (`#D4D4D4`) is used only for emphasis cases like the highlighted pricing card.

### The accent: brand red

`#E53935` is the only chromatic colour the system ever places at full saturation. Use it for:

- The most important number on a screen (lifetime brain cells, time remaining, streak count).
- The single primary CTA per screen, when it's a gradient — pair with `#F97316` to form the warm CTA gradient.
- "LIVE" / "EARNED" / "ACTIVE" pill badges.
- Focused input borders.
- Onboarding progress fill.

It must **not** appear on:

- Body text (use `text` or `text-secondary`).
- Decorative lines, dividers, or rules.
- Card backgrounds.
- More than one element per visible viewport, except in onboarding hero moments.

The dark-mode counterpart is `#FF5252` — slightly brighter to clear AA contrast on the dark surface.

### Semantic colours

`success: #22C55E`, `error: #EF4444`, `info: #3B82F6`. These are scoped strictly to their semantic role: green for "schedule active", red for "denied permission", blue for informational tooltips. They never decorate. `error` is intentionally *not* the same red as the brand accent — semantic red is muted, brand red is sharp.

### Anti-pattern

Do not introduce purple, teal, or amber as a brand-level decorative colour. Those hues exist only inside the per-game tile illustrations (Phosphor duotone icons) where each game has a hue chosen for recognition, not branding. Outside game tiles, the palette is monochrome + red.

## Typography

The face is **Geist** (Vercel's open-source typeface, SIL OFL, loaded via `@expo-google-fonts/geist`). Four weights are loaded: 400, 500, 600, 700. The system reuses 700 for any heavier weight to keep the bundle small.

**The single biggest typographic rule: headlines are weight 500, not 700.** This is the largest perceptual shift in the system. Stack the hierarchy with size and tracking, not weight. Bold (700) is reserved for:

- The brand stat number ("47 min remaining" — but only when the stat is the screen's headline element).
- A single word of inline emphasis inside a paragraph.

Tracking goes negative as size grows:

| Role | Size | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 36 | 500 | -1.0 | Hero headlines (paywall, onboarding aha screen). One per screen. |
| Headline | 28 | 500 | -0.6 | Tab title ("Brain Games"), section heading. |
| Title | 20 | 500 | -0.3 | Card titles, list item primaries. |
| Body | 15 | 400 | 0 | Default running text. |
| Body small | 13 | 400 | 0 | Captions, secondary descriptions. |
| Label | 11 | 500 | 1.6 | Eyebrow text, badge labels, tab bar labels. **UPPERCASE.** |
| Stat | 36 | 500 | -1.0 | Big accent-coloured numbers. Always the focal point of its container. |

### The Eyebrow → Heading → Muted-description stack

Every section starts with a small uppercase **Eyebrow** label, then a medium-weight **SectionHeading**, then a **muted-coloured description**. This is the structural pattern that ties the system together. It's encoded in `src/components/ui/anvil.tsx` as `<Eyebrow>`, `<SectionHeading>`, `<MutedText>`. Use those primitives, don't reinvent the stack.

### Italic for emphasis

A single italic word inside a SectionHeading is the system's emphasis idiom — borrowed from the Anvil reference. *"Brain games **and** earned time."* Italics are otherwise rare; never italicise body paragraphs.

## Elevation

The system is **deliberately flat**. Shadows are not the elevation primitive — borders and color contrast are.

**The shadow vocabulary, when shadows do appear:**

| Token | When |
|---|---|
| `shadow-card` (4dp y-offset, 6% opacity, 10dp radius, neutral black) | Floating tiles, sticky headers. Never on the default card surface. |
| `shadow-pill` (1dp y-offset, 5% opacity, 2dp radius) | Primary pill button. Tiny lift, just enough to read as pressable. |
| `shadow-modal` (8dp y-offset, 14% opacity, 24dp radius) | Modals only. |

The base `<AnvilCard>` has **no shadow** — the hairline border does the work. If you find yourself reaching for a coloured shadow (red glow, brand-tinted drop), stop: that's a previous-system reflex. The current system answers "how do I separate this card from the surface?" with `border-color: #EBEBEB`, not a shadow.

Dark mode: replace the hairline with `dark-border` (`#2E2E2E`). Shadows mostly disappear in dark mode — the surface contrast does the work.

## Components

The components below are the canonical primitives. New screens should compose these, not invent variants.

### PillButton

Rounded-full, 44pt height, generous horizontal padding (24pt). Two variants: **primary** fills with `colors.text` and renders text in `colors.background`; **secondary** is transparent with a hairline border. The fill colour intentionally inverts to true near-black on white — this is the system's most assertive contrast moment, used for the single primary CTA per screen. The CTA gradient (`#E53935 → #F97316`) is a separate primitive (`<OnboardingButton>`) used only in onboarding for the moments when the user is being asked to commit.

Pressed state: scale to 0.97 with a spring (friction 8, tension 100), 80–120ms duration. No colour change on press — the scale carries the feedback.

### AnvilCard

Surface: `colors.surface`. Border: `colors.border-hairline`, 1pt. Radius: `rounded.xl` (20pt). Padding: `lg` (22pt) by default; `xl` (28pt) for hero cards; `md` (16pt) for dense list cards.

`highlighted` variant promotes the border to `colors.accent` at 2pt — used for the recommended pricing plan, the active onboarding step, and the selected difficulty.

**Nested cards are forbidden.** A card inside a card is always a structural mistake — use a divider rule or a section break instead.

### Game Tile

`width = (screenWidth − 2×16 − 10) / 2`, height = width × 0.96. Surface: `colors.surface`. Border: hairline. Radius: `rounded.lg` (16pt). Internal padding 14pt. The tile contains, top to bottom: a state pill ("LIVE" / "LOCKED"), a centered Phosphor duotone illustration, a footer row with the title and an `ArrowUpRight` icon (only for live tiles). Locked tiles fade the illustration to 0.3 opacity and grey the title.

### Eyebrow / SectionHeading / MutedText

The structural triplet for every screen. See Typography. They live in `src/components/ui/anvil.tsx` and they should be the default — even one-off screens should pull them in instead of inlining `<Text fontSize=...>`.

### Pill (badge)

Rounded-full, 4pt × 10pt padding. Three tones: **neutral** (gray fill, secondary text), **accent** (red tint, red text), **success** (green tint, green text). Always include the leading dot — the dot is what makes it read as a status pill, not a tag chip.

### Stat

Big accent-coloured number (Stat typography role) above a Title-weight label above an optional Body-small description. Used for "12 brain cells", "47 min remaining", "5-day streak". When three or more Stats sit side by side, separate them with `border-hairline` divider rules — not gaps alone.

### Tab bar

iOS uses `BlurView` over the system blur tint matching the theme. Active tint `colors.accent`. Inactive tint `#B0A99F` (light) / `#4A4A5A` (dark). Labels are the Label typography role. Active state shows a `colors.accent + "25"` (15% alpha) rounded-12 background pill behind the icon — this is the system's indicator of selection. Tab bar uses **Geist 500**, not 600 — the slightly lighter weight reads as quieter, which is what a tab bar should be.

### OnboardingButton

The CTA-gradient primary button used inside onboarding. Distinct from the standard PillButton: filled with the `#E53935 → #F97316` gradient, dark text (`#0A0A0F`), and an idle breathing pulse animation (1.0 → 1.015 → 1.0 over 2.8s) that draws the eye on hero screens. Outside onboarding, prefer the standard PillButton.

## Do's and Don'ts

**Do** lead every screen with the Eyebrow → Heading → Muted-description stack. Even simple settings panes benefit from a one-line muted description that explains why the user is here.

**Do** use Geist weight 500 for headlines. Resist the urge to bold-up.

**Do** treat the brand red as a finite resource. If two elements on a screen want to be red, one of them is wrong.

**Do** double-encode state in shape and text. "Locked" must come with a lock icon AND the word LOCKED, not colour alone. This protects colour-blind users and reinforces the system's tendency to be explicit.

**Do** vary spacing for rhythm. The Spacing scale is the menu; pick from it. Don't pad everything at 16.

**Don't** use side-stripe borders (`border-left: 4px solid <color>`) on cards or list items. Banned by the design laws and visually weak. Use a full border or a leading icon instead.

**Don't** use gradient text. The CTA gradient lives on button fills, never on type.

**Don't** wrap the unlock count, brain cells, or streak in a "hero metric" template (big number + small label + supporting stat + gradient accent). That's the SaaS dashboard cliché. Show the number plain, in the accent colour, with a quiet label beneath. The system's restraint *is* the design move.

**Don't** introduce new chromatic colours (purple, teal, amber, navy) outside game-tile illustrations. Single accent, period.

**Don't** stack cards inside cards. If you find yourself doing this, replace the inner card with a `border-hairline` divider rule and inline content.

**Don't** decorate with shadows. If a card needs a shadow to feel separate from the surface, the surface needs more contrast — fix that instead.

**Don't** use em dashes ( — ) in copy. Commas, colons, semicolons, parentheses. This is a copy-tone signal: the brand voice is conversational, not editorial.

<!--
Generated by `/impeccable document` (executed by Claude using extracted
tokens from src/constants/theme.ts, the Anvil primitives in
src/components/ui/anvil.tsx, and the components already in use across
the app). Sections follow the Stitch DESIGN.md spec exactly:
Overview, Colors, Typography, Elevation, Components, Do's and Don'ts.
-->
