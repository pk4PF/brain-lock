# Brainlock — Build Plan & Roadmap

A living doc for where the app is and where it's going. No dates committed — this
is direction and priority. Edit freely.

> **The model (the spine).** Brainlock measures your **Brain Rot Score** (0–100,
> higher = more rotted). **Blocking** the junk apps + **training in the Brain
> Gym** drive it *down*; **unlocking to scroll** drives it *up*. One legible
> number you check daily and try to push down — that's the whole product, and
> it's natively shareable.

---

## ✅ Shipped this session — the Brain Rot pivot

The app's spine moved from "earn cells/minutes by passing a game to unlock" → a
single Brain Rot Score.

- **Score state & math** — `brainRot: number | null` in the store; helpers in
  `src/utils/brainRot.ts` (`baselineRot`, `rotBand`, share message). `null`
  until the benchmark is taken.
- **Benchmark** — Memory Tiles run with `?benchmark=1` (free, never paywalled)
  sets the baseline = self-reported screen time − test performance.
- **Brain Gym** (games tab, labelled "Brain Gym") — three sections: **Tests**
  (the games), **Knowledge** (general knowledge, flags), **Calm** (Box
  Breathing, `app/games/breathe.tsx`). Games are now **pure training** — they
  lower rot (−2 win / −1 loss / −2 breathing), they don't gate anything.
- **Soft unlock** — direct from Home via a 15 / 30 / 60-min picker, no challenge.
  Each costs rot (+3 / +5 / +10). `unlockApps(minutes)` in the store.
- **Home** leads with the score (or a "Take the benchmark" CTA). **Stats** shows
  the score + a branded **share card** (view-shot + expo-sharing).
- **Onboarding** reworked end-to-end off the old "earn it by passing a test"
  messaging onto the brain-rot loop.
- **App blocking untouched** — the Family Controls moat stays exactly as-is.

---

## Phase 1 — Make the directional model feel alive  *(next, cheap, high impact)*

The model works but the *feel* is flat. Polish the feedback so the number feels
like it's reacting to you.

1. **Invert the meter** — the bar should fill as you get *cleaner* (show
   `100 − rot`), not fill up as you rot. Gives "progress climbing" dopamine while
   keeping the low-is-good number. (Home + Stats meters.)
2. **Delta celebration** — when the score moves, flash it: "**−3 🔥**" on a Gym
   rep, "**+5**" on an unlock. The win-feeling is in the movement, not the absolute.
3. **Benchmark reveal moment** — after the benchmark, count the number up and
   land on the band ("78 — Deep rot"). Make it the gut-punch it should be.
4. **Copy audit** — Stats subhead still says "Play games to bring it down" →
   "Train in the Brain Gym." Sweep for any other "cells/credits/earn" stragglers.
5. **Kill the dead cell economy** — `credits`, `SpendCellsModal`,
   `WelcomeBonusModal`, brain-coin UI, unused store fns. It's invisible debt now
   that rot is the currency. Decide: remove fully vs keep hidden.

---

## Phase 2 — Make the score REAL  *(the moat)*

Today the score is **directional**: seeded by *self-reported* screen time, then
only moved by in-app buttons. It does not know if you actually scrolled less.
This is the upgrade that makes it legitimate instead of a vanity number.

- **DeviceActivity integration** — read actual usage of the *blocked* apps via
  the monitor extension already in the app, so real scrolling raises rot and real
  abstinence holds it down.
- **Daily recompute / decay** — the score drifts based on yesterday's real
  behaviour (used the junk → up; trained / stayed off → down), so it's a daily
  verdict, not just a tally of taps.
- Native lift, but it's the difference between a gimmick and a product with a moat.

---

## Phase 3 — The viral loop  *(growth)*

The share asset is built; now make people *want* to post and compete.

- **Share card polish** — tighten the exported image (the TikTok/slideshow
  asset). Save-to-Photos is the pipeline.
- **Streaks** tied to keeping your rot low (not just opening the app).
- **Leaderboards & competitions** *(the big future bet)* — compare your Brain
  Rot Score with friends; weekly "who rotted least" challenges. Genuinely viral
  and nobody's done block + score + compete. ⚠️ Needs accounts + a backend
  (social graph, sync) — the first real server-side lift. Scope as its own track.

---

## Phase 4 — Brain Gym content expansion

The Gym is the engagement engine; feed it. Mostly reframing + light new content,
*not* three new apps.

- **Calm** — more than box breathing: breathing variants, a short meditation/
  timer. Keep it honest and small to start.
- **Knowledge** — more trivia categories (geography, sport, history…).
- **Daily workout** — a prescribed 3-rep routine ("today's session") that pulls a
  set amount off your score, building a daily habit.
- **Custom challenges (long-term)** — users/creators define their own reps.

---

## Phase 5 — Ship & monetize

- **Fresh TestFlight build** — the signing/extension saga is solved (build 64
  shipped all 4 targets); cut a new build with the whole pivot in it.
- **Winback product** — set up the £24.99/yr intro-offer product in App Store
  Connect + RevenueCat (id contains `winback`) so `final-offer.tsx` resolves.
- **Premium gating** — confirm what's behind the paywall in the new model
  (unlimited Gym? the score itself is free). Pricing already set: weekly £7.99 +
  annual £49.99 anchor, £24.99 winback.

---

## 🎮 Longer-term bets (parked, still good)

- **Brain mascot** — a character whose *health* = how un-rotted you are and whose
  *size* = how much you train. Visualises the score on something you don't want
  to let down. Needs an art set; high retention/virality upside.
- **Gamified design overhaul** — warmer, more playful UI to match the Gym
  metaphor; celebration moments, sound.
- **Widget / Live Activity** — brain rot score or unlock countdown on the
  home screen / lock screen.

---

## 📌 Open decisions

- **Unlock model:** pure soft-cost (current — unlock anytime, costs rot) vs a
  hybrid that re-adds friction. Watch whether soft-cost actually curbs scrolling.
- **Score direction:** locked as low-is-good "brain rot" (the hook + the
  shareable-bad-number). Revisit only if data says flex > relatability.
- **"Brain Gym" naming** — kept despite the *Brain Gym®* trademark (education
  class). Low-to-moderate risk as a feature name; revisit before any big push.
- **Dead cell economy** — remove vs keep hidden.

---

## 🔧 Known issues / tech debt

- Score is directional until Phase 2 (DeviceActivity) lands.
- `+rot` on unlock fires on the *unlock action*, not on actual scrolling.
- Cell/credit code still present but unused under the new model.
- Onboarding `demo-game` still uses cup-shuffle as the "try the Gym" moment —
  fine, but the benchmark game (Memory Tiles) might be the stronger demo.
