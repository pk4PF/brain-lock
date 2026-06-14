import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GameType, Difficulty } from '../constants/games';
import { ThemeMode } from '../constants/theme';
import { getTodaysWorkoutKeys, WORKOUT_REWARD } from '../constants/workout';

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
 *  cell cost AND the minutes granted (1:1). Order is the visual grid order.
 *
 *  Floor is 15 because iOS DeviceActivitySchedule silently drops monitoring
 *  for sub-15-minute windows - the unlock would expire but apps would stay
 *  unlocked until Brainlock was reopened (a real bug a paying user hit).
 *  Anything below 15 min is unsupported on the platform. */
export const UNLOCK_TIERS: ReadonlyArray<number> = [15, 20, 25, 30];
export const GAME_REWARD = 5;

/**
 * Brainlock 2.0: difficulty maps directly to how long the app unlocks.
 * Floors at 15 because iOS DeviceActivitySchedule silently drops monitoring
 * for sub-15-min windows (see UNLOCK_TIERS note) - so Easy is 15, not 5.
 */
export const DIFFICULTY_UNLOCK_MINUTES: Record<Difficulty, number> = {
  easy: 15,
  medium: 30,
  hard: 60,
};

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
  mindfulness: number;
  knowledge: number;
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
  /** Per-cognitive-area reps done today (resets at midnight). Drives the
   *  daily Brainpower dashboard. */
  dailyReps: Record<string, number>;
  /** App unlocks today (resets at midnight). Each one drains today's score. */
  dailyUnlocks: number;
  /** Workout game keys completed today (resets at midnight). */
  dailyWorkoutDone: string[];
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
  /** True once we've asked for a review at the first successful unlock. */
  firstUnlockReviewed: boolean;
  /** True once the winback (final-offer) screen has been shown. The offer is
   *  a one-time "you'll never see this again" play, so we never surface it a
   *  second time once the user has laid eyes on it. */
  winbackSeen: boolean;
  /** Whether the post-onboarding welcome bonus (30 brain cells) has been
   *  shown and claimed. False until the user taps "Claim" on the modal. */
  welcomeBonusClaimed: boolean;
  bestFocusScore: number;
  /** Brainpower Score, 0-100, higher = sharper (0 = fully brain rotted). The app's
   *  spine metric. Null until the user takes the in-app benchmark. Training
   *  raises it; unlocking apps to scroll lowers it. */
  brainScore: number | null;
  /** Transient raw per-aspect scores (0-100) collected during a benchmark run.
   *  The reveal composites these into the Brainpower Score, then clears them. */
  benchmarkScores: Record<string, number>;
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
  /** Reset all per-day counters if the calendar day has rolled over. */
  rollDailyIfNeeded: () => void;
  /** Today's Brainpower: training fills it (per-area reps), unlocks drain it. */
  getDailyBrainpower: () => { score: number; areaPct: Record<string, number>; unlocks: number; training: number; penalty: number };
  canEarnToday: () => boolean;
  canPlayGame: () => boolean;
  earnsRemainingToday: () => number;
  gamesRemainingToday: () => number;
  earnReward: (amount: number) => void;
  spendCredits: (amount?: number) => boolean;
  /** Brainlock 2.0: pass a challenge → unlock blocked apps for the duration
   *  mapped from the chosen difficulty (Easy 15 / Med 30 / Hard 60 min). */
  unlockApps: (minutes: number) => void;
  /** Re-block immediately, ending the current unlock early (user is done
   *  scrolling and wants the timer to stop). */
  relockApps: () => void;
  /** Set the Brainpower Score outright (benchmark result). */
  setBrainScore: (score: number) => void;
  /** Nudge the score up/down (training +, scrolling -). No-op until the
   *  benchmark has been taken. Clamped 0-100. */
  adjustBrainScore: (delta: number) => void;
  /** Record one benchmark test's raw aspect score during a benchmark run. */
  setBenchmarkScore: (aspect: string, score: number) => void;
  clearBenchmarkScores: () => void;
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
  /** Marks the winback (final-offer) screen as seen so it's never shown again. */
  markWinbackSeen: () => void;
  /** Grants the post-onboarding 30-cell welcome bonus exactly once.
   *  Returns true if the bonus was granted, false if already claimed. */
  claimWelcomeBonus: () => boolean;
  /** Expo push token string, e.g. "ExponentPushToken[xxx]". Null until
   *  the user grants notification permission and registration succeeds. */
  expoPushToken: string | null;
  setExpoPushToken: (token: string | null) => void;
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
  sequence:      { played: 0, won: 0, bestTime: 999 },
  anagram:       { played: 0, won: 0, bestTime: 999 },
  'color-match': { played: 0, won: 0, bestTime: 999 },
  'block-tap':   { played: 0, won: 0, bestTime: 999 },
  'number-seq':  { played: 0, won: 0, bestTime: 999 },
  'tile-recall': { played: 0, won: 0, bestTime: 999 },
  chimp:         { played: 0, won: 0, bestTime: 999 },
  'cup-shuffle': { played: 0, won: 0, bestTime: 999 },
  schulte:       { played: 0, won: 0, bestTime: 999 },
  'general-knowledge': { played: 0, won: 0, bestTime: 999 },
  flags:         { played: 0, won: 0, bestTime: 999 },
  reaction:      { played: 0, won: 0, bestTime: 999 },
  'digit-span':  { played: 0, won: 0, bestTime: 999 },
  'time-stop':   { played: 0, won: 0, bestTime: 999 },
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
      brainScore: null,
      benchmarkScores: {},
      cognitiveScores: {
        memory: 0,
        recall: 0,
        attention: 0,
        speed: 0,
        problemSolving: 0,
        mindfulness: 0,
        knowledge: 0,
      },
      lockedApps: [],
      dailyGamesCompleted: 0,
      dailyEarnTasksCompleted: 0,
      dailyDate: '',
      dailyReps: {},
      dailyUnlocks: 0,
      dailyWorkoutDone: [],
      appsUnlocked: false,
      setupGuideComplete: false,
      credits: 0,
      totalXpEarned: 0,
      unlockExpiresAt: null,
      unlockTotalMs: null,
      reviewPromptShownAt: null,
      firstUnlockReviewed: false,
      winbackSeen: false,
      welcomeBonusClaimed: false,
      expoPushToken: null,
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

        // Every gym rep pushes the Brainpower Score up - wins harder than losses.
        get().adjustBrainScore(won ? +2 : +1);

        // Today's Brain Workout: mark this game done if it's in today's set;
        // completing the full set awards the workout bonus (once).
        get().rollDailyIfNeeded();
        const wToday = new Date().toISOString().split('T')[0];
        const workoutKeys = getTodaysWorkoutKeys(wToday);
        if (workoutKeys.includes(game) && !get().dailyWorkoutDone.includes(game)) {
          const done = [...get().dailyWorkoutDone, game];
          set({ dailyWorkoutDone: done });
          if (done.length === workoutKeys.length) get().adjustBrainScore(WORKOUT_REWARD);
        }

        // Review prompts at high-intent milestones. Apple rate-limits to
        // 3/year so calling at multiple points is safe — only one will show.
        if (won && newProgress.gamesWon === 10) {
          require('../services/review').requestReviewNow?.('10th_win');
        }
        if (newProgress.currentStreak === 7) {
          require('../services/review').requestReviewNow?.('7_day_streak');
        }
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
        //  - A great FIRST run alone shouldn't peg the bar at 100 - we want
        //    headroom so 5+ great runs can climb toward Elite.
        //  - Bad days hurt gently: 10% drag toward a low score.
        //
        // Math:
        //  - First game (current === 0): seed with the midpoint of (target, 50).
        //    A perfect 100 first run lands at 75 ("Sharp" zone), a 60 lands at
        //    55 ("Steady" zone). This prevents the "bottom tier from the jump"
        //    feeling without making everything look maxed from one play.
        //  - Subsequent games: ratchet 25% of the way toward target. ~5 great
        //    runs to climb from 75 → 90+, ~10 to approach the ceiling. Feels
        //    like real progression, not a grind.
        // Daily Brainpower: count one rep in this area today (always, even on
        // a "bad day" where the lifetime score doesn't move).
        get().rollDailyIfNeeded();
        set({ dailyReps: { ...get().dailyReps, [area]: (get().dailyReps[area] ?? 0) + 1 } });

        const target = Math.max(0, Math.min(100, gameScore));
        const { cognitiveScores } = get();
        const current = cognitiveScores[area] ?? 0;

        let next: number;
        if (current === 0) {
          // First-ever run in this area: cushioned seed.
          next = (target + 50) / 2;
        } else if (target >= current) {
          // Good game: ratchet 25% toward the score.
          next = current + (target - current) * 0.25;
        } else {
          // Bad game: drag down 10% toward the score — bad days hurt, but gently.
          next = current + (target - current) * 0.1;
        }

        const rounded = Math.round(next * 10) / 10;
        set({ cognitiveScores: { ...cognitiveScores, [area]: rounded } });
      },

      completeDailyGame: (creditsEarned = GAME_REWARD) => {
        get().rollDailyIfNeeded();
        set({
          dailyGamesCompleted: get().dailyGamesCompleted + 1,
          dailyEarnTasksCompleted: get().dailyEarnTasksCompleted + 1,
        });
        get().earnReward(creditsEarned);

        triggerReviewAfterWin();
      },

      rollDailyIfNeeded: () => {
        const today = new Date().toISOString().split('T')[0];
        if (get().dailyDate !== today) {
          set({
            dailyDate: today,
            dailyGamesCompleted: 0,
            dailyEarnTasksCompleted: 0,
            dailyReps: {},
            dailyUnlocks: 0,
            dailyWorkoutDone: [],
          });
        }
      },

      getDailyBrainpower: () => {
        const today = new Date().toISOString().split('T')[0];
        const isToday = get().dailyDate === today;
        const reps = isToday ? get().dailyReps : {};
        const unlocks = isToday ? get().dailyUnlocks : 0;
        const TARGET = 2; // reps per area for a full bar
        const AREAS = ['memory', 'attention', 'problemSolving', 'recall', 'speed', 'mindfulness'];
        const areaPct: Record<string, number> = {};
        let sum = 0;
        for (const a of AREAS) {
          const pct = Math.min(100, Math.round(((reps[a] ?? 0) / TARGET) * 100));
          areaPct[a] = pct;
          sum += pct;
        }
        const training = Math.round(sum / AREAS.length);
        const penalty = Math.min(60, unlocks * 12); // each unlock -12, capped
        const score = Math.max(0, Math.min(100, training - penalty));
        return { score, areaPct, unlocks, training, penalty };
      },

      checkDailyReset: () => {
        get().rollDailyIfNeeded();
        get().checkUnlockExpiry();
      },

      setExpoPushToken: (token) => set({ expoPushToken: token }),

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
        // Cap stored credits at the display capacity (100). Lifetime XP
        // keeps accumulating uncapped — it's a stat, not a currency.
        set({
          credits: Math.min(CELL_DISPLAY_CAPACITY, credits + amount),
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

      unlockApps: (minutes) => {
        const mins = minutes > 0 ? minutes : 15;
        const totalMs = mins * 60 * 1000;
        const expiresAt = Date.now() + totalMs;
        set({
          appsUnlocked: true,
          unlockExpiresAt: expiresAt,
          unlockTotalMs: totalMs,
        });
        // Scrolling has a visible cost: 1 Brainpower per minute unlocked.
        // 15m → -15, 30m → -30, 60m → -60. Training is the only way back up.
        get().adjustBrainScore(-mins);
        // Daily Brainpower: log this unlock so today's dashboard reflects it.
        get().rollDailyIfNeeded();
        set({ dailyUnlocks: get().dailyUnlocks + 1 });
        try {
          const { ScreenTime } = require('screen-time-module');
          ScreenTime.removeShieldNow().catch(() => { });
          // Native re-block via the DeviceActivityMonitor extension - survives
          // the app being backgrounded or killed.
          ScreenTime.scheduleUnlockExpiry(mins).catch(() => { });
        } catch { }

        // First successful unlock = the payoff moment → ask for a review (once).
        if (!get().firstUnlockReviewed) {
          set({ firstUnlockReviewed: true });
          setTimeout(() => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              require('../services/review').requestReviewNow?.('first_unlock');
            } catch { }
          }, 1200);
        }
      },

      relockApps: () => {
        set({ appsUnlocked: false, unlockExpiresAt: null, unlockTotalMs: null });
        try {
          const { ScreenTime } = require('screen-time-module');
          ScreenTime.applyShieldNow().catch(() => { });
          ScreenTime.cancelUnlockExpiry().catch(() => { });
        } catch { }
      },

      setBrainScore: (score) => {
        set({ brainScore: Math.max(0, Math.min(100, Math.round(score))) });
      },

      adjustBrainScore: (delta) => {
        const { brainScore } = get();
        if (brainScore === null) return; // not measured yet - nothing to nudge
        let d = delta;
        // Diminishing returns: training gains taper as you near 100, so the
        // last stretch to Elite is hard. Penalties (scrolling) are NOT tapered.
        // Full gains below 60; above that, scaled by remaining headroom / 40.
        if (d > 0 && brainScore >= 60) {
          d = d * Math.max(0, (100 - brainScore) / 40);
        }
        // Stored as a float so sub-1 gains still accumulate near the top;
        // displays round it. Clamped 0-100.
        set({ brainScore: Math.max(0, Math.min(100, brainScore + d)) });
      },

      setBenchmarkScore: (aspect, score) => {
        set({ benchmarkScores: { ...get().benchmarkScores, [aspect]: Math.max(0, Math.min(100, Math.round(score))) } });
      },
      clearBenchmarkScores: () => set({ benchmarkScores: {} }),

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
        const { unlockExpiresAt, appsUnlocked } = get();
        if (appsUnlocked && unlockExpiresAt && Date.now() > unlockExpiresAt) {
          set({ appsUnlocked: false, unlockExpiresAt: null, unlockTotalMs: null });
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.applyShieldNow().catch(() => { });
            ScreenTime.cancelUnlockExpiry().catch(() => { });
          } catch { }
        } else if (appsUnlocked && unlockExpiresAt) {
          // Unlock still active — re-remove shields in case a stale native
          // callback re-applied them (e.g. delayed intervalDidEnd from a
          // previous unlock window). Self-heals within one polling cycle.
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.removeShieldNow().catch(() => { });
          } catch { }
        }
      },

      markReviewPromptShown: () => set({ reviewPromptShownAt: Date.now() }),

      markWinbackSeen: () => set({ winbackSeen: true }),

      claimWelcomeBonus: () => {
        const { welcomeBonusClaimed, credits, totalXpEarned } = get();
        if (welcomeBonusClaimed) return false;
        // 25 cells. Combined with the 5 cells the user banked from the
        // demo Memory Tiles play, that's 30 total on first Home land -
        // exactly one 30-min unlock or two 15-min ones.
        const BONUS = 25;
        set({
          welcomeBonusClaimed: true,
          credits: Math.min(CELL_DISPLAY_CAPACITY, credits + BONUS),
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
      version: 10,
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
        // v9 → v10: add expoPushToken for push notification support.
        if (version < 10) {
          state = {
            ...state,
            expoPushToken: state.expoPushToken ?? null,
          };
        }
        return state;
      },
    }
  )
);
