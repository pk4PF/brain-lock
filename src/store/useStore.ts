import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GameType } from '../constants/games';
import { ThemeMode } from '../constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const FREE_DAILY_GAME_LIMIT = 1;
export const FREE_APP_BLOCK_LIMIT = 1;
export const FREE_DAILY_EARN_LIMIT = 1;

export const XP_PER_LEVEL = 100;
// One brain cell = one minute of unlocked apps. Strict 1:1.
// The user picks how many cells to spend on the Spend Cells sheet -
// duration tiers run 1, 2, 3, 5, 10, 15, 20, 25, 30 minutes. UNLOCK_CREDIT_COST
// (below) is now only the *default* tile selection, not the only spend size.
export const UNLOCK_CREDIT_COST = 20;
export const UNLOCK_MINUTES = 20;
/** Display-only cap on the Brain Cells progress card (target the user sees
 *  themselves filling up). Earning isn't actually capped - we just stop
 *  growing the bar past 100. Picked so a fully-stocked user can spend the
 *  max 30-min tier ~3 times before needing to grind more. */
export const CELL_DISPLAY_CAPACITY = 100;
/** Hard cap on how many cells the user can spend in a single unlock. Mirrors
 *  the duration tiers (max tier = 30 min = 30 cells). Keeps unlock sessions
 *  bounded so the loop stays a loop. */
export const UNLOCK_MAX_CELLS = 30;
/** The duration tiers shown on the Spend Cells sheet. Each value is both the
 *  cell cost AND the minutes granted (1:1). Order is the visual grid order. */
export const UNLOCK_TIERS: ReadonlyArray<number> = [1, 2, 3, 5, 10, 15, 20, 25, 30];
export const GAME_REWARD = 5;

// Back-compat aliases (callers may still import old names)
export const UNLOCK_XP_COST = UNLOCK_CREDIT_COST;
export const GAME_XP_REWARD = GAME_REWARD;

export interface GameStats {
  played: number;
  won: number;
  bestTime: number;
}

export interface UserProgress {
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  gamesPlayed: number;
  gamesWon: number;
  gameStats: Record<GameType, GameStats>;
  weeklyPoints: number[];
}

/**
 * The five cognitive areas we measure. Each is a normalised 0-100 score,
 * tracking the user's best performance across runs of the games that
 * train that area. This is the "Brain Profile" surfaced on the Stats tab -
 * the app sells "you're getting smarter," not "you're not on Instagram."
 *
 * Mapping (game → area):
 *   Memory Match  → memory
 *   Word Recall   → recall   (verbal memory, separate from visual)
 *   Focus Flash   → attention
 *   Reaction Test → speed
 *   Quick Math    → problemSolving
 */
export interface CognitiveScores {
  memory: number;
  recall: number;
  attention: number;
  speed: number;
  problemSolving: number;
}

export type CognitiveArea = keyof CognitiveScores;

export interface AppLockEntry {
  appName: string;
  bundleId: string;
  isLocked: boolean;
}

export interface Settings {
  enabledGames: GameType[];
  challengesRequired: number;
  hapticFeedback: boolean;
  soundEnabled: boolean;
  screenTimeAuthorized: boolean;
  screenTimeAppCount: number;
  theme: ThemeMode;
  disableDifficulty: 'easy' | 'medium' | 'hard' | 'hardest';
}

interface AppState {
  lastAppVersion: string;
  onboardingComplete: boolean;
  userName: string;
  userStruggles: string[];
  userGoals: string[];
  /** Self-reported acquisition source from the onboarding "How did you
   *  hear about us?" screen. Mirrored onto the PostHog person profile
   *  so every downstream event carries it for marketing attribution. */
  referralSource: string | null;
  /** Self-reported daily screen-time hours from onboarding slider, used to
   *  calculate the personalised "you'll lose X days/year" gut-punch. */
  dailyScreenTimeHours: number;
  ageBand: string | null;
  /** Numeric age supplied during onboarding. Drives the lifetime-screen-time
   *  calculation on the insecurity screen. Null until the user picks. */
  userAge: number | null;
  isPremium: boolean;
  subscriptionPlan: string | null;
  demoGameScore: number | null;
  progress: UserProgress;
  lockedApps: AppLockEntry[];
  settings: Settings;
  dailyGamesCompleted: number;
  dailyEarnTasksCompleted: number;
  dailyDate: string;
  appsUnlocked: boolean;
  setupGuideComplete: boolean;
  credits: number;
  totalXpEarned: number;
  unlockExpiresAt: number | null;
  /** Total duration (ms) of the *current* unlock session. Used by the Home
   *  countdown card to compute progress %, since unlocks are now variable
   *  length (1-30 min) instead of always 20. Null when no unlock is active. */
  unlockTotalMs: number | null;
  reviewPromptShownAt: number | null;
  /** Whether the post-onboarding welcome bonus (30 brain cells) has been
   *  shown and claimed. False until the user taps "Claim" on the modal. */
  welcomeBonusClaimed: boolean;
  bestFocusScore: number;
  cognitiveScores: CognitiveScores;

  completeOnboarding: () => void;
  setUserName: (name: string) => void;
  setUserStruggles: (struggles: string[]) => void;
  setUserGoals: (goals: string[]) => void;
  setReferralSource: (source: string) => void;
  setDailyScreenTimeHours: (hours: number) => void;
  setAgeBand: (ageBand: string) => void;
  setUserAge: (age: number) => void;
  setSubscription: (plan: string) => void;
  clearSubscription: () => void;
  setDemoGameScore: (score: number) => void;
  addPoints: (points: number) => void;
  recordGame: (game: GameType, won: boolean, timeTaken: number) => void;
  recordFocusScore: (accuracyPct: number) => void;
  /**
   * Record a normalised 0-100 score for a cognitive area. We always keep
   * the user's best - never decrease, since this powers the Brain Profile
   * which should feel like progress, not a treadmill.
   */
  recordCognitiveScore: (area: CognitiveArea, score: number) => void;
  completeDailyGame: (creditsEarned?: number) => void;
  checkDailyReset: () => void;
  canEarnToday: () => boolean;
  canPlayGame: () => boolean;
  earnsRemainingToday: () => number;
  gamesRemainingToday: () => number;
  earnReward: (amount: number) => void;
  spendCredits: (amount?: number) => boolean;
  // Aliases kept for older callers
  earnXP: (amount: number) => void;
  spendXP: (amount?: number) => boolean;
  getLevel: () => number;
  getXpToNextLevel: () => number;
  /** Lifetime stats for a game key. Always returns a defaulted shape so
   *  call-sites (the games-tab tile progress strip) don't have to handle
   *  unseen-game undefined. */
  getGameStat: (game: GameType) => GameStats;
  checkUnlockExpiry: () => void;
  markReviewPromptShown: () => void;
  /** Grants the post-onboarding 30-cell welcome bonus exactly once.
   *  Returns true if the bonus was granted, false if already claimed. */
  claimWelcomeBonus: () => boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleAppLock: (appName: string, bundleId: string) => void;
  completeSetupGuide: () => void;
}

const defaultGameStats: Record<GameType, GameStats> = {
  math:          { played: 0, won: 0, bestTime: 999 },
  memory:        { played: 0, won: 0, bestTime: 999 },
  'word-recall': { played: 0, won: 0, bestTime: 999 },
  focus:         { played: 0, won: 0, bestTime: 999 },
  reaction:      { played: 0, won: 0, bestTime: 999 },
  sequence:      { played: 0, won: 0, bestTime: 999 },
  anagram:       { played: 0, won: 0, bestTime: 999 },
  'color-match': { played: 0, won: 0, bestTime: 999 },
  'block-tap':   { played: 0, won: 0, bestTime: 999 },
  'number-seq':  { played: 0, won: 0, bestTime: 999 },
  'tile-recall': { played: 0, won: 0, bestTime: 999 },
};

/**
 * Fire the native store-review prompt after the user has completed a real
 * challenge. Lazy-required so the review service (which imports useStore)
 * doesn't create a circular module dependency at load time. The review
 * service is itself idempotent and silently fails if the native module is
 * absent, so it's safe to call from any completion path.
 */
function triggerReviewAfterWin() {
  setTimeout(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { maybeShowReviewPrompt } = require('../services/review');
      maybeShowReviewPrompt?.();
    } catch {
      // No-op: review module not bundled or native module missing.
    }
  }, 1500);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lastAppVersion: APP_VERSION,
      onboardingComplete: false,
      userName: '',
      userStruggles: [],
      userGoals: [],
      referralSource: null,
      dailyScreenTimeHours: 4,
      ageBand: null,
      userAge: null,
      isPremium: false,
      subscriptionPlan: null,
      demoGameScore: null,
      progress: {
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: '',
        gamesPlayed: 0,
        gamesWon: 0,
        gameStats: { ...defaultGameStats },
        weeklyPoints: [0, 0, 0, 0, 0, 0, 0],
      },
      bestFocusScore: 0,
      cognitiveScores: {
        memory: 0,
        recall: 0,
        attention: 0,
        speed: 0,
        problemSolving: 0,
      },
      lockedApps: [],
      dailyGamesCompleted: 0,
      dailyEarnTasksCompleted: 0,
      dailyDate: '',
      appsUnlocked: false,
      setupGuideComplete: false,
      credits: 0,
      totalXpEarned: 0,
      unlockExpiresAt: null,
      unlockTotalMs: null,
      reviewPromptShownAt: null,
      welcomeBonusClaimed: false,
      showPaywall: false,
      settings: {
        enabledGames: ['math'],
        challengesRequired: 1,
        hapticFeedback: true,
        soundEnabled: true,
        screenTimeAuthorized: false,
        screenTimeAppCount: 0,
        theme: 'light',
        disableDifficulty: 'easy',
      },

      completeOnboarding: () => {
        set({ onboardingComplete: true });
        // Lazy-required to avoid circular import (analytics → store → analytics).
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { track, Events } = require('../services/analytics');
          track(Events.OnboardingCompleted);
        } catch { /* analytics module not loadable; non-fatal */ }
      },

      setUserName: (name) => set({ userName: name }),

      setReferralSource: (source) => set({ referralSource: source }),

      setUserStruggles: (struggles) => set({ userStruggles: struggles }),

      setUserGoals: (goals) => set({ userGoals: goals }),

      setDailyScreenTimeHours: (hours) => set({ dailyScreenTimeHours: hours }),

      setAgeBand: (ageBand) => set({ ageBand }),

      setUserAge: (age) => set({ userAge: Math.max(13, Math.min(80, Math.round(age))) }),

      setSubscription: (plan) =>
        set({ isPremium: true, subscriptionPlan: plan }),

      clearSubscription: () =>
        set({ isPremium: false, subscriptionPlan: null }),

      setDemoGameScore: (score) => set({ demoGameScore: score }),

      addPoints: (points) => {
        const { progress } = get();
        const today = new Date().toISOString().split('T')[0];
        const newProgress = { ...progress };
        newProgress.totalPoints += points;

        const dayOfWeek = new Date().getDay();
        const weekly = [...newProgress.weeklyPoints];
        weekly[dayOfWeek] += points;
        newProgress.weeklyPoints = weekly;

        if (newProgress.lastPlayedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          if (newProgress.lastPlayedDate === yesterdayStr) {
            newProgress.currentStreak += 1;
          } else {
            newProgress.currentStreak = 1;
          }
          newProgress.lastPlayedDate = today;
        }
        if (newProgress.currentStreak > newProgress.longestStreak) {
          newProgress.longestStreak = newProgress.currentStreak;
        }
        set({ progress: newProgress });
      },

      recordGame: (game, won, timeTaken) => {
        const { progress } = get();
        const newProgress = { ...progress };
        const stats = { ...(newProgress.gameStats[game] ?? { played: 0, won: 0, bestTime: 999 }) };
        stats.played += 1;
        if (won) {
          stats.won += 1;
          if (timeTaken < stats.bestTime) stats.bestTime = timeTaken;
        }
        newProgress.gameStats = { ...newProgress.gameStats, [game]: stats };
        newProgress.gamesPlayed += 1;
        if (won) newProgress.gamesWon += 1;
        set({ progress: newProgress });
      },

      recordFocusScore: (accuracyPct) => {
        const { bestFocusScore } = get();
        if (accuracyPct > bestFocusScore) {
          set({ bestFocusScore: Math.min(100, Math.max(0, Math.round(accuracyPct))) });
        }
      },

      recordCognitiveScore: (area, gameScore) => {
        // Performance-driven score with diminishing returns near the ceiling.
        //
        // Goals:
        //  - A great first run is rewarded (no "0 → 10 after a perfect game").
        //  - A great FIRST run alone shouldn't peg the bar at 100 — we want
        //    headroom so 5+ great runs can climb toward Elite.
        //  - Bad days don't hurt: only upward movement is recorded.
        //
        // Math:
        //  - First game (current === 0): seed with the midpoint of (target, 50).
        //    A perfect 100 first run lands at 75 ("Sharp" zone), a 60 lands at
        //    55 ("Steady" zone). This prevents the "bottom tier from the jump"
        //    feeling without making everything look maxed from one play.
        //  - Subsequent games: ratchet 25% of the way toward target. ~5 great
        //    runs to climb from 75 → 90+, ~10 to approach the ceiling. Feels
        //    like real progression, not a grind.
        const target = Math.max(0, Math.min(100, gameScore));
        const { cognitiveScores } = get();
        const current = cognitiveScores[area] ?? 0;

        let next: number;
        if (current === 0) {
          // First-ever run in this area: cushioned seed.
          next = (target + 50) / 2;
        } else {
          if (target <= current) return; // bad days don't hurt
          next = current + (target - current) * 0.25;
        }

        const rounded = Math.round(next * 10) / 10;
        set({ cognitiveScores: { ...cognitiveScores, [area]: rounded } });
      },

      completeDailyGame: (creditsEarned = GAME_REWARD) => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyDate, dailyGamesCompleted, dailyEarnTasksCompleted } = get();
        const gameCount = dailyDate === today ? dailyGamesCompleted + 1 : 1;
        const earnCount = dailyDate === today ? dailyEarnTasksCompleted + 1 : 1;
        set({
          dailyGamesCompleted: gameCount,
          dailyEarnTasksCompleted: earnCount,
          dailyDate: today,
        });
        get().earnReward(creditsEarned);

        triggerReviewAfterWin();
      },

      checkDailyReset: () => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyDate } = get();
        if (dailyDate !== today) {
          set({
            dailyGamesCompleted: 0,
            dailyEarnTasksCompleted: 0,
            dailyDate: today,
          });
        }
        get().checkUnlockExpiry();
      },

      // Paywall now lives only in onboarding - once a user is past it, every
      // earn / game / unlock action is unconditionally available. We keep the
      // setter and the can* predicates so all the existing call sites stay
      // compiling, but they're no-ops: setShowPaywall never flips the modal,
      // and canEarnToday / canPlayGame always grant access.
      setShowPaywall: (_show) => {
        /* no-op: in-app paywall removed, onboarding gate is the only paywall */
      },

      canEarnToday: () => true,

      canPlayGame: () => true,

      earnsRemainingToday: () => {
        const { isPremium, dailyEarnTasksCompleted, dailyDate } = get();
        if (isPremium) return Infinity;
        const today = new Date().toISOString().split('T')[0];
        const count = dailyDate === today ? dailyEarnTasksCompleted : 0;
        return Math.max(0, FREE_DAILY_EARN_LIMIT - count);
      },

      gamesRemainingToday: () => get().earnsRemainingToday(),

      earnReward: (amount) => {
        const { credits, totalXpEarned } = get();
        set({
          credits: credits + amount,
          totalXpEarned: totalXpEarned + amount,
        });
      },

      earnXP: (amount) => get().earnReward(amount),

      spendCredits: (amount = UNLOCK_CREDIT_COST) => {
        const { credits } = get();
        if (credits < amount) return false;
        // Cells map 1:1 to minutes - spend N cells, unlock for N minutes.
        // Clamp to UNLOCK_MAX_CELLS so callers can't accidentally pass huge
        // amounts (e.g. from buggy UI state).
        const minutes = Math.min(UNLOCK_MAX_CELLS, Math.max(1, amount));
        const totalMs = minutes * 60 * 1000;
        const expiresAt = Date.now() + totalMs;
        set({
          credits: credits - amount,
          appsUnlocked: true,
          unlockExpiresAt: expiresAt,
          unlockTotalMs: totalMs,
        });
        try {
          const { ScreenTime } = require('screen-time-module');
          ScreenTime.removeShieldNow().catch(() => { });
          // Schedule the native re-block via DeviceActivityMonitor extension.
          // This is what survives the app being backgrounded or killed.
          ScreenTime.scheduleUnlockExpiry(minutes).catch(() => { });
        } catch { }
        return true;
      },

      spendXP: (amount = UNLOCK_CREDIT_COST) => get().spendCredits(amount),

      getLevel: () => {
        const { totalXpEarned } = get();
        return Math.floor(totalXpEarned / XP_PER_LEVEL) + 1;
      },

      getXpToNextLevel: () => {
        const { totalXpEarned } = get();
        const currentLevelStart = Math.floor(totalXpEarned / XP_PER_LEVEL) * XP_PER_LEVEL;
        return XP_PER_LEVEL - (totalXpEarned - currentLevelStart);
      },

      getGameStat: (game) => {
        const stats = get().progress.gameStats[game];
        return stats ?? { played: 0, won: 0, bestTime: 999 };
      },

      checkUnlockExpiry: () => {
        // Foreground belt-and-braces. The DeviceActivityMonitor extension
        // is the primary mechanism for re-blocking after the unlock window
        // expires; this just ensures the JS state stays consistent if the
        // extension fired while the app was killed.
        const { unlockExpiresAt, appsUnlocked } = get();
        if (appsUnlocked && unlockExpiresAt && Date.now() > unlockExpiresAt) {
          set({ appsUnlocked: false, unlockExpiresAt: null, unlockTotalMs: null });
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.applyShieldNow().catch(() => { });
            ScreenTime.cancelUnlockExpiry().catch(() => { });
          } catch { }
        }
      },

      markReviewPromptShown: () => set({ reviewPromptShownAt: Date.now() }),

      claimWelcomeBonus: () => {
        const { welcomeBonusClaimed, credits, totalXpEarned } = get();
        if (welcomeBonusClaimed) return false;
        const BONUS = 30;
        set({
          welcomeBonusClaimed: true,
          credits: credits + BONUS,
          totalXpEarned: totalXpEarned + BONUS,
        });
        return true;
      },

      updateSettings: (partial) => {
        const { settings } = get();
        set({ settings: { ...settings, ...partial } });
      },

      completeSetupGuide: () => set({ setupGuideComplete: true }),

      toggleAppLock: (appName, bundleId) => {
        const { lockedApps } = get();
        const apps = [...lockedApps];
        const idx = apps.findIndex((a) => a.bundleId === bundleId);
        if (idx >= 0) {
          apps[idx] = { ...apps[idx], isLocked: !apps[idx].isLocked };
        } else {
          apps.push({ appName, bundleId, isLocked: true });
        }
        set({ lockedApps: apps });
      },
    }),
    {
      name: 'brainlock-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 9,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) return persistedState;
        let state = persistedState;
        // v1 → v2: rename brainCells → xp, seed totalXpEarned, add new fields
        if (version < 2) {
          const brainCells = typeof state.brainCells === 'number' ? state.brainCells : 0;
          const totalPoints = state?.progress?.totalPoints ?? 0;
          state = {
            ...state,
            xp: brainCells,
            totalXpEarned: Math.max(brainCells, totalPoints),
            ageBand: state.ageBand ?? null,
            dailyEarnTasksCompleted: state.dailyEarnTasksCompleted ?? state.dailyGamesCompleted ?? 0,
            reviewPromptShownAt: state.reviewPromptShownAt ?? null,
          };
        }
        // v2 → v3: rename xp → credits
        if (version < 3) {
          const xp = typeof state.xp === 'number' ? state.xp : 0;
          const credits = typeof state.credits === 'number' ? state.credits : xp;
          state = { ...state, credits };
          delete state.xp;
        }
        // v3 → v4: legacy backfill for physicalStats (now removed in v5).
        // No-op kept for version-counter consistency.
        // v4 → v5: drop physicalStats entirely (workouts removed from app),
        // seed userGoals and bestFocusScore for the new attention-test game.
        if (version < 5) {
          delete state.physicalStats;
          state = {
            ...state,
            userGoals: Array.isArray(state.userGoals) ? state.userGoals : [],
            bestFocusScore: typeof state.bestFocusScore === 'number' ? state.bestFocusScore : 0,
          };
        }
        // v5 → v6: seed dailyScreenTimeHours for existing users so the
        // onboarding slider has a sensible default if they ever revisit.
        if (version < 6) {
          state = {
            ...state,
            dailyScreenTimeHours:
              typeof state.dailyScreenTimeHours === 'number' ? state.dailyScreenTimeHours : 4,
          };
        }
        // v6 → v7: TestFlight reset. Older builds shipped with dark theme +
        // partial onboarding state that survived reinstalls. Force theme back
        // to 'light', reset the onboarding gate and the per-onboarding answers
        // so testers see a clean first-run after updating.
        if (version < 7) {
          state = {
            ...state,
            hasOnboarded: false,
            settings: {
              ...(state.settings ?? {}),
              theme: 'light',
            },
            dailyScreenTimeHours: 4,
            reviewPromptShownAt: null,
          };
        }
        // v7 → v8: strip schedule fields (replaced by always-blocked model
        // with DeviceActivityMonitor-driven unlock-window re-block).
        if (version < 8) {
          const s = { ...(state.settings ?? {}) };
          delete s.activeHoursStart;
          delete s.activeHoursEnd;
          delete s.activeDays;
          delete s.screenTimeScheduleEnabled;
          state = { ...state, settings: s };
        }
        // v8 → v9: introduce welcomeBonusClaimed. Existing users who already
        // finished onboarding shouldn't suddenly get a "welcome" modal - mark
        // them as already-claimed. Only fresh onboardings hit the bonus flow.
        if (version < 9) {
          state = {
            ...state,
            welcomeBonusClaimed: state.onboardingComplete === true ? true : false,
          };
        }
        return state;
      },
    }
  )
);
