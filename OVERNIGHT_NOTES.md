# Overnight pass — onboarding polish

A walk-through of every change, why it landed, what to look at first
in the morning, and what I deliberately did **not** touch.

---

## TL;DR

I rebuilt every onboarding screen on the same Anvil primitives the main
app already uses (`Eyebrow → SectionHeading → MutedText`), pulled the
hardcoded brand-red gradient out of `OnboardingButton` so onboarding
matches the app's actual orange accent (`#FF6A1A`), removed all the
chromatic noise (emoji chips, per-game tile colours in the mockup),
and demoted every `FontFamily.heavy` / `bold` / `semibold` headline I
edited down to `medium`. The main-app tabs are untouched. Games
internals are untouched.

TypeScript: every file I edited compiles. Lint: the diff added 0 new
warnings (verified by running ESLint over `app/onboarding/` and
`src/components/onboarding/` before and after — count went 37 → 35).

---

## The biggest thing to know

**`DESIGN.md` is stale.** It says the brand accent is red `#E53935`.
Your `src/constants/theme.ts` says `#FF6A1A` (orange) and the entire
main app uses orange consistently. The onboarding `OnboardingButton`
was the outlier — it hardcoded `['#E53935', '#F97316']` for its
gradient, which is why onboarding felt off-brand from the rest. I
brought onboarding in line with the orange theme, not the other way.

If you actually wanted the app to be red, the fix is the opposite —
update `theme.ts` and `Gradients` in one place. Either way, the
onboarding now matches whatever `theme.colors.accent` is, no
hardcoded hexes.

---

## What changed, screen by screen

### Component primitives

**`src/components/onboarding/OnboardingButton.tsx`**
Killed the red-→-orange `LinearGradient`. Now a solid pill in
`colors.accent`, height 56, radius 999, weight 500. Removed the
drop shadow — DESIGN.md elevation rules say no shadow when border
contrast does the work. Secondary variant lost the `.semibold` font
in favour of `medium`. Pulse animation kept for the "breathing CTA"
moment.

**`src/components/onboarding/OnboardingLayout.tsx`**
Ambient orbs no longer hardcode `rgba(229,57,53,…)` — they pull from
`colors.accentLight` and `colors.accentGlow`. Future-proof against
any palette pivot.

**`src/components/onboarding/ChipGroup.tsx`**
Removed emoji rendering. The `emoji?` prop is kept for type-compat
but marked `@deprecated`. Chips are now monochrome label-only,
weight 500 (was 600), padding tightened. Selected state is the only
chromatic moment — accent border + accent check pill.

### Onboarding screens

**`splash.tsx`** — orb colours now from theme (was hardcoded red).
Otherwise unchanged; the splash anatomy was already correct.

**`aha.tsx`** — full rebuild. Was: `HeroIcon` plate + 56pt stat +
17pt context + divider + 15pt hook. Now: `Eyebrow` ("THE PROBLEM") +
giant 128pt accent stat ("96") + tiny "TIMES A DAY" eyebrow under it
+ divider + a single `MutedText` paragraph. Same visual hook (the
big number) but on the canonical primitive stack.

**`screentime.tsx`** — rebuild. Killed the `HeroIcon` plate. Header
now `Eyebrow → SectionHeading → MutedText`. The "X.Y hours/day"
readout grew from 72pt to 96pt — it's the focal stat, the rest of
the screen is plumbing for it. Slider thumb border now uses
`colors.background` instead of hardcoded `#FFFFFF`. Track uses
`colors.cardAlt` instead of the off-spec `#E8DFD3`.

**`insecurity.tsx`** — rebuild. Same treatment: drop the Hourglass
icon plate, lead with `Eyebrow`, push the lost-days number to 128pt,
end with a quiet `MutedText` foot. The narrative hits harder when
the number is the screen.

**`goal.tsx`** — rebuild. Header now uses Anvil stack ("YOUR WHY" /
"What would you do with your time back?" / "Pick what matters to
you. We'll keep it in mind."). Removed all eight emojis from the
chip options (📚😴💪🧘🧠❤️🎯🎨) — they were the only chromatic
elements in onboarding, breaking the single-accent rule. Chips now
work on label + selection state alone.

**`name.tsx`** — rebuild. Killed the `HeroIcon`. Header uses Anvil
stack. **Crucially**: the input was using `FontFamily.semibold` (600),
which violates the design law that headlines/inputs use weight 500.
Now `medium`. Letter-spacing tightened to `-0.3` to match Title role.

**`commitment.tsx`** — replaced the hand-rolled inline-style eyebrow
with `<Eyebrow>`. Replaced the 40pt one-off heading with
`<SectionHeading size="lg">` (28pt). Replaced the manual `<Text>`
sub with `<MutedText>`. The Hand-icon was inside the commit button
— it's gone; the gesture (tap + breathing pulse + haptic) carries
the moment without needing the icon. Confetti retained.

**`howitworks.tsx`** — already used `Eyebrow + PillButton`, so
mostly clean. The big fix: the games-grid mockup was using
hardcoded chromatic colours (`#7C3AED` purple, `#10B981` green,
`#F97316` orange, `#E53935` red) for each tile. The real Games tab
is monochrome. So I made the mockup monochrome too — every tile uses
`colors.accent + colors.accentLight + colors.accentGlow`. That's
truer to what the user will actually see. Also fixed mockup frame
backgrounds: were hardcoded `#FFFFFF` and `#FAFAFA`, now use
`colors.card` and `colors.cardAlt`, so dark mode no longer flashes
near-white panels. The lock badges no longer have a hardcoded white
border.

**`demo-block.tsx`** — rebuild of the header. Was: 88pt iconBox plate
+ 28pt `FontFamily.heavy` title + 15pt sub. Now: `Eyebrow → Section­
Heading → MutedText`. The Shield icon was redundant once the header
copy was in place — removed. Card title weight: `bold` → `medium`.
Buttons: replaced the inline TouchableOpacity primary with
`<OnboardingButton>` (which now matches the rest of the app), kept
the secondary outline button but removed `1.5` border-width nonsense
in favour of consistent height-56 rounded buttons. The "skip" link
font weight: `semibold` → `regular` (it's a tertiary link, not a CTA).

**`demo-earn.tsx`** — rebuild. Was: red-tinged eyebrow + 28pt heavy
title + 14pt regular sub. Now: `Eyebrow → SectionHeading → MutedText`.
Step rows: title weight `bold` → `medium`, step number badge weight
`heavy` → `medium`. Connector line went from 2pt thick to 1pt — a
hairline, matching the rest of the app's structural weight.

**`demo-game.tsx`** — kept the bouncing brain (reduced-motion friendly,
that's a good moment). Replaced the inline 36pt title with
`<SectionHeading size="lg">`. Added an `<Eyebrow>` ("Try a round")
above. Sub now `<MutedText>`. Reward chip ("+5 cells") logic
unchanged — the highlight on it is correct.

**`demo-spend.tsx`** — biggest cleanup of the lot. Was using
hardcoded `#EF4444` red and `#22C55E` green for the lock/unlock
icons. The locked state isn't an *error*, it's just a default —
demoted it to neutral (`colors.cardAlt` + `colors.muted` icon).
Unlocked uses brand accent (`colors.accentLight` + `colors.accent`)
because that's the success / reward moment. Semantic green
(`colors.success`) is now reserved for the "Unlocked. Easy." text
confirmation — true to the system's "double-encode state in shape
and text" rule. Header rebuilt on Anvil stack. Headlines: `heavy` →
`medium`. The `→` text-arrow swapped for an `ArrowRight` icon at
14pt (proper geometric shape, doesn't get cropped by font metrics).

**`review.tsx`** — minor. Star colour was hardcoded `#F5A623`
amber, doesn't match the system's monochrome-plus-orange palette.
Now uses `colors.accent`. Header rebuilt on Anvil stack.
Star size 32 → 28 to match the more restrained header weight.

**`paywall.tsx`** — minor. Three stray `FontFamily.semibold` on plan
rows demoted to `medium`. Otherwise the screen was already on-spec.

**`final-offer.tsx`, `plan.tsx`, `intro.tsx`, `index.tsx`** — not
touched. Already used `FontFamily.medium` on headings, already used
the canonical pattern. `intro.tsx` is just a redirect, `index.tsx`
is a redirect.

---

## What I deliberately did NOT touch

**The five tab screens** (`app/(tabs)/index.tsx`, `lock.tsx`, `games.tsx`,
`stats.tsx`, `settings.tsx`). These were already on-spec. Every
audit pass came back clean — Anvil primitives, monochrome surfaces,
proper Eyebrow stacks, no nested cards, no side-stripe borders.

**Game internals** (`app/games/{math,focus,memory,reaction,word-recall}.tsx`).
Each game has its own gradient personality (math = cyan, focus =
indigo, reaction = amber, memory = violet, word-recall = indigo) and
its own intro/result screens. Unifying them all under `GameShell`
like math.tsx does would be a multi-hour rewrite that violates the
"conservative" directive you set. The big-bold in-game numbers (the
focus digit, math problem, score) are correctly bold per
DESIGN.md's "bold reserved for headline stat" rule.

**The theme tokens** (`theme.ts`). The `accent: '#FF6A1A'` orange is
the source of truth as far as I can tell — every main-app screen
uses it correctly. If you want to flip back to red, that's a
*decision*, not a fix. One file, ten lines, you can do it tomorrow
if you want.

**`DESIGN.md` itself.** It's out of date in two ways: (1) calls the
accent `#E53935` red, (2) describes "warm CTA gradient" that nothing
in the app actually uses anymore. Update is one paragraph but it's
a written-spec change, not a code change.

**Tamagui type errors** in `DisableCountdownScreen.tsx`,
`AppScreen.tsx`, `GlowCard.tsx`, `GoldButton.tsx`, `IconBadge.tsx`,
`SectionTitle.tsx`, `TimePickerSheet.tsx`, and the
`screen-time-module` native module. These pre-date this pass and are
unrelated to the onboarding work. Fixing them likely needs a
Tamagui version bump.

---

## Things to look at first in the morning

In rough priority order:

1. **The orange CTA in onboarding.** Open the app, walk through
   onboarding splash → aha → screentime → name → commitment. The
   button colour on every CTA should now match the orange in the
   main app. If it still feels too saturated, the fix is one line in
   `theme.ts` (lower the saturation of `accent`). Don't tweak the
   button itself — it's pulling from the token.

2. **The big stats on `aha.tsx` and `insecurity.tsx`.** Both grew to
   128pt. On a small device (SE-class) the number might wrap or
   collide with the divider. If it does, drop both to 96pt — change
   `bigStat.fontSize` and `bigStat.lineHeight` together, ratio ~1.03.

3. **`goal.tsx` chips without emojis.** I think the new look is
   stronger, but you're the one who shipped the emoji version. If
   they feel too plain, the right move is to add a leading
   monochrome dot to each chip (4×4, `colors.muted`), not to bring
   the emojis back.

4. **`howitworks.tsx` page 2 mockup.** I made the games grid
   monochrome to match the real Games tab. Decide whether you'd
   rather *teach* with the multi-coloured tiles (helps a new user
   visually parse "these are different games") or stay restrained.
   It's a real trade-off; the current restrained version is more
   on-brand but slightly less informative.

5. **`demo-spend.tsx` colour semantics.** I made locked = neutral
   grey, unlocked = orange (the reward), confirmation text = green.
   This reads as a fair-trade, not a danger/safety system. Sanity-
   check on device — if the locked state looks too inert, accent it
   instead and demote unlocked to green.

6. **Dark mode on `howitworks.tsx`.** The mockup frames were
   hardcoded white before. Now they use `colors.card`. Should look
   correct in both modes — but worth a 30-second toggle check.

---

## Verification

- `npx tsc --noEmit` — every file I touched compiles. Pre-existing
  errors (Tamagui types in `DisableCountdownScreen.tsx`, `AppScreen.tsx`,
  `GlowCard.tsx`, etc.) are unchanged from before this pass.
- `npx eslint app/onboarding/ src/components/onboarding/` — 35
  problems, all pre-existing (unescaped apostrophes in JSX,
  exhaustive-deps warnings on top-level animation refs). Down 2
  from baseline (the two `isDark` unused warnings I caused by
  removing dark-mode branches in `OnboardingLayout.tsx` and
  `splash.tsx`, both fixed).
- `npx expo lint` over the full tree timed out — same baseline
  issue, unrelated.

I didn't run on simulator. You'll want to walk the onboarding flow
once before TestFlight; the typography / spacing changes are large
enough that 1–2 screens may need a 4–8pt nudge that's invisible
without seeing it on a real device.
