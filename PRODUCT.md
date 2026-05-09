# Product

## Register

product

<!--
Brain Lock is an iOS app surface — design serves the function (blocking
apps, playing games, unlocking time). Not a marketing/landing context.
The marketing site at plbtk.com is a separate surface; PRODUCT.md here
governs the in-app experience only.
-->

## Users

22–35 year olds who feel addicted to short-form-video apps (Instagram, TikTok, YouTube Shorts, Reddit) and have already tried 2–3 blockers (Opal, Forest, Freedom, ScreenZen) and quit. They open the app at moments of weakness — usually mid-scroll, late at night, or first thing in the morning — looking for *friction*, not a lecture.

The job to be done: make my apps stop opening for me, but in a way I can't disable in 30 seconds. Earn the right to scroll, instead of feeling guilty about it.

Primary task on any given screen:
- **Home**: see how much "earned time" I have and whether my apps are currently locked.
- **Block**: configure which apps to block and during what hours.
- **Games**: play a 30–90 second game to earn a brain cell.
- **Stats**: see my progress without it feeling like a guilt trip.
- **Profile**: tweak settings or restore my subscription.

Context: phone-only, often one-handed, often interrupted, often in a low-willpower state. Sessions are short (under 2 minutes for the games loop) and emotionally loaded (the user is fighting their own habits).

## Product Purpose

Brain Lock turns the impulse to open Instagram/TikTok into a 60-second cognitive workout, then unlocks the apps as a reward. iOS Screen Time blocks the apps; brain cells (earned by playing games) buy the right to use them.

Success looks like:
- The user opens Brain Lock more often than the apps it blocks.
- They feel a small dopamine hit from earning a brain cell, not shame from being blocked.
- They keep their subscription past the 1-month mark.

Why it exists: every other blocking app either treats the user like a child (Forest's tree-killing guilt), feels like enterprise software (Freedom), or is so easy to disable that the friction evaporates (Opal). Brain Lock's wedge is a *fair trade* — you can have the apps, you just have to do something useful first.

## Brand Personality

**Direct. Quietly confident. Not preachy.**

Voice rules:
- Talks to the user like a friend who lifts weights and does Anki cards, not a wellness coach. Casual but never twee.
- Never uses the word "mindful". Never uses lotus or meditation imagery. Never lectures about screen time damage.
- Numbers and outcomes over feelings. "12 brain cells" beats "great job!". "47 min earned today" beats "you're doing amazing".
- One joke per onboarding flow at most. Humour earns its place; doesn't carry the design.

Emotional goals:
- **Calm** when blocked: the locked screen should feel like a closed door, not an alarm.
- **Sharp** during a game: tight feedback, no fluff between rounds.
- **Earned** when unlocking: the unlock animation is the reward, not a confetti explosion.

## Anti-references

Things this should explicitly NOT look or feel like:

- **Calm / Headspace** — pastel gradients, lotus flowers, breathy copy. Wellness-industrial complex aesthetic.
- **Forest** — gamification with cartoon trees and guilt. Childish.
- **Opal** — too rounded, too friendly, too easy to dismiss. Feels like it forgives you in advance.
- **Duolingo's recent direction** — manipulative streak guilt, hyper-coloured mascot. Brain Lock is anti-streak-shame.
- **Generic SaaS dashboard** — gradient hero, three-column feature grid, "Trusted by" logo strip. We are not a B2B tool.
- **Crypto/AI app aesthetic** — neon on near-black, glow effects, Space Mono headers. Not us.

## Design Principles

1. **Earned, not forced.** The app's job is to make blocking feel like a fair trade the user opted into, not a punishment imposed on them. Every screen should reflect that — language ("earn", not "must"), animation (release, not denial), colour (warm reward, not cold restriction).
2. **The friction IS the feature.** Screens that exist to slow the user down (the unlock confirmation, the difficulty picker, the disable countdown) are *load-bearing*. They should be deliberate and unhurried, not optimised away.
3. **Restraint beats decoration.** One accent colour. Headlines at weight 500, not 800. Hairline borders, not heavy shadows. Anything that decorates without serving the loop gets cut.
4. **Numbers over adjectives.** Show the user concrete state — "47 min remaining", "3 cells", "5 games played today" — instead of mood language. Stats build trust faster than copy.
5. **One-handed by default.** Primary actions sit in the bottom third of the screen. Targets are 44pt minimum. Anything that requires reaching the top of a 6.7-inch screen has failed unless it's explicitly low-frequency.

## Accessibility & Inclusion

- WCAG **AA** colour contrast on all text against its background. Red accent (#E53935) needs to clear AA on white — verified.
- Support **Dynamic Type** at least up to "Large" without breaking layout. Headers can clip at "XL", that's acceptable.
- Honour **Reduce Motion**: the brain-cell-earned animation, the unlock celebration, and the breathing button pulse all need `prefers-reduced-motion` paths.
- Honour **Reduce Transparency**: the iOS tab bar uses `BlurView` — fall back to solid `colors.card` when reduce-transparency is on.
- **Haptics** are confirmation, never decoration. Light haptic for taps, medium for unlocking, success haptic for game completion. No haptic for navigation.
- Colour-blind safe: don't rely on red-vs-green alone for state. Locked = lock icon + "LOCKED" pill. Unlocked = unlock icon + countdown timer. State is doubled in shape and text.

<!--
Generated by `/impeccable teach` (executed by Claude based on
conversation history with the user, not a fresh interview).
Edit anything that doesn't match your intent — every other Impeccable
command reads this file before doing any work.
-->
