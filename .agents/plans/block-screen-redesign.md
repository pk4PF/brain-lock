# Block Apps Screen Redesign

## Goal
Consolidate all screen time & app blocking into a single, streamlined flow on the **Block** tab. When users try to open a blocked app, they're redirected to complete brain challenges before the app unlocks.

---

## Current State

| Area | What Exists |
|------|------------|
| **Block tab** (`lock.tsx`) | Step-by-step setup: 1) Enable Screen Time → 2) Pick Apps → 3) Set Schedule. Also has Quick Actions (Block Now / Unblock All) and info cards. |
| **Profile tab** (`settings.tsx`) | ✅ Active Hours section already removed (previous change). Challenges Required + Difficulty still here. |
| **Challenge gate** (`challenge/index.tsx`) | Shows when a blocked app is opened — displays lock icon, progress dots, and a "Start Challenge" button that routes to a random game. But it **doesn't track completion** properly (the `challengesCompleted` state resets on unmount). |
| **Native module** (`screen-time-module`) | Full iOS Screen Time integration: auth, app picker, schedule, shield on/off. |

## Problems to Fix

1. **Active Hours are display-only** in the Block tab — there's no way to change them (it says "Change hours in the Profile tab" but we just removed that).
2. **Challenges Required** setting is only in Profile — should be in Block tab since it's part of the blocking flow.
3. **Challenge gate doesn't properly track** completed games — the counter resets when navigating to a game and back.
4. **Flow is disconnected** — setup steps, schedule, and unlock config are scattered.

---

## Redesigned Flow

### Block Tab — Single Page, Progressive Disclosure

The screen reveals sections as the user completes each step:

```
┌─────────────────────────────────────┐
│  🛡️  Block Apps                     │
│  "Earn your screen time"            │
├─────────────────────────────────────┤
│                                     │
│  ① ENABLE SCREEN TIME               │
│  [Enable Screen Time]  ✅ or →      │
│                                     │
│  ② CHOOSE APPS TO BLOCK             │  ← appears after ① done
│  [Select Apps]  "3 selected"        │
│                                     │
│  ③ SET BLOCKING HOURS               │  ← appears after ② done
│  ┌──────────────────────────┐       │
│  │  FROM        TO          │       │
│  │  [–] 06:00 [+] [–] 23:00 [+]    │
│  └──────────────────────────┘       │
│  [Activate Schedule] / [Disable]    │
│                                     │
│  ④ UNLOCK SETTINGS                  │  ← appears after ② done
│  "Games required to unlock:"       │
│  [ 1 game ] [ 2 games ] [ 3 games ] │
│                                     │
│  ⚡ QUICK ACTIONS                   │  ← appears after schedule active
│  [Block Now]    [Unblock All]       │
│                                     │
│  ℹ️ How it works                    │
│  "When you open a blocked app,     │
│   you'll need to complete X brain   │
│   challenges before it unlocks."    │
└─────────────────────────────────────┘
```

### Challenge Gate — Proper Game Completion Tracking

When a shielded app is opened → redirected to `challenge/index.tsx`:

```
┌─────────────────────────────────────┐
│                                     │
│         🔒  Instagram is Locked     │
│                                     │
│    Complete 2 brain challenges      │
│    to unlock this app               │
│                                     │
│        ● ○    (1 of 2 done)         │
│                                     │
│    [ ⚡ Start Challenge ]            │
│                                     │
│         ← Go Back                   │
│                                     │
└─────────────────────────────────────┘
```

After completing a game → returns here → counter incremented → once all done → auto-removes shield for that session.

---

## Implementation Steps

### Step 1: Move Active Hours controls INTO the Block tab
**File:** `app/(tabs)/lock.tsx`

- Replace the **read-only** hours display (lines 463-481) with the **editable** +/- controls (previously in `settings.tsx`).
- Remove the "Change hours in the Profile tab" text (line 482-483).
- Import `Minus`, `Plus` icons back into `lock.tsx`.

### Step 2: Move "Challenges Required" into the Block tab
**File:** `app/(tabs)/lock.tsx`

- Add a new **"Step 4: Unlock Settings"** section after the schedule section.
- Shows the 1/2/3 game selector pills (same UI as currently in `settings.tsx`).
- Appears when `isAuthorized && hasApps` (same condition as schedule).

**File:** `app/(tabs)/settings.tsx`

- Remove the "Challenges to Unlock" section since it's now in the Block tab.

### Step 3: Fix Challenge Gate completion tracking
**File:** `app/challenge/index.tsx`

- Use a **persisted counter** (either via `useStore` or `AsyncStorage`) to track `challengesCompleted` for the current "unlock session".
- When navigating to a game, store the current count.
- When returning from a game, check if the game was successfully completed (won), and increment the counter.
- When all challenges are completed, auto-call `ScreenTime.removeShieldNow()` to unblock apps for that session.
- Add a `useEffect` or focus listener to detect returning from a game.

**File:** `src/store/useStore.ts`

- Add `unlockChallengesCompleted: number` and `unlockSessionActive: boolean` to the store.
- Add actions: `startUnlockSession()`, `incrementUnlockChallenge()`, `resetUnlockSession()`.

### Step 4: Clean up Profile tab
**File:** `app/(tabs)/settings.tsx`

- Remove the "Challenges to Unlock" section entirely (moved to Block tab).
- Profile now only has: Profile Card, Game Types, Difficulty, Preferences (haptics + sound).

### Step 5: Update "How it works" copy
**File:** `app/(tabs)/lock.tsx`

- Update the info/how-it-works text to be clearer:
  > "When you try to open a blocked app during your active hours, BrainLock will ask you to complete [X] brain challenge(s) first. Beat them all to unlock your apps!"

---

## Files Changed

| File | Change |
|------|--------|
| `app/(tabs)/lock.tsx` | Add editable hours, add challenges-required selector, update copy |
| `app/(tabs)/settings.tsx` | Remove "Challenges to Unlock" section |
| `app/challenge/index.tsx` | Fix completion tracking, auto-unblock on success |
| `src/store/useStore.ts` | Add unlock session state + actions |

## Files NOT Changed
- Native module (`screen-time-module/`) — no changes needed
- Games — no changes needed
- Onboarding — no changes needed

---

## Order of Operations
1. **Make it work**: Steps 1-4 (move UI, fix tracking)
2. **Make it right**: Step 5 (polish copy, ensure clean transitions)
3. **Make it fast**: No optimization needed for this change
