import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { GameType } from '../constants/games';
import { ThemeMode } from '../constants/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export const FREE_DAILY_GAME_LIMIT = 1;
export const FREE_APP_BLOCK_LIMIT = 1;
export const FREE_DAILY_EARN_LIMIT = 1; // Total earn tasks per day (games + physical combined)

export const XP_PER_LEVEL = 100;
export const UNLOCK_CREDIT_COST = 100;
export const UNLOCK_MINUTES = 10;
export const GAME_REWARD = 5;
export const REPS_TO_REWARD: Record<number, number> = { 10: 5, 20: 10, 30: 15 };

// Back-compat aliases (callers may still import old names)
export const UNLOCK_XP_COST = UNLOCK_CREDIT_COST;
export const GAME_XP_REWARD = GAME_REWARD;
export const REPS_TO_XP = REPS_TO_REWARD;

export interface GameStats {
  played: number;
  won: number;
  bestTime: number;
}

export interface PhysicalTaskStats {
  completed: number;
  totalReps: number;
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

export interface AppLockEntry {
  appName: string;
  bundleId: string;
  isLocked: boolean;
}

export interface Settings {
  enabledGames: GameType[];
  challengesRequired: number;
  activeHoursStart: number;
  activeHoursEnd: number;
  hapticFeedback: boolean;
  soundEnabled: boolean;
  screenTimeAuthorized: boolean;
  screenTimeAppCount: number;
  screenTimeScheduleEnabled: boolean;
  activeDays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  theme: ThemeMode;
  disableDifficulty: 'easy' | 'medium' | 'hard' | 'hardest';
}

export type PhysicalTaskType = 'pushups' | 'squats';

interface AppState {
  lastAppVersion: string;
  onboardingComplete: boolean;
  userName: string;
  userStruggles: string[];
  ageBand: string | null;
  isPremium: boolean;
  subscriptionPlan: string | null;
  demoGameScore: number | null;
  progress: UserProgress;
  physicalStats: Record<PhysicalTaskType, PhysicalTaskStats>;
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
  reviewPromptShownAt: number | null;

  completeOnboarding: () => void;
  setUserName: (name: string) => void;
  setUserStruggles: (struggles: string[]) => void;
  setAgeBand: (ageBand: string) => void;
  setSubscription: (plan: string) => void;
  clearSubscription: () => void;
  setDemoGameScore: (score: number) => void;
  addPoints: (points: number) => void;
  recordGame: (game: GameType, won: boolean, timeTaken: number) => void;
  recordPhysicalTask: (type: PhysicalTaskType, reps: number) => void;
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
  checkUnlockExpiry: () => void;
  markReviewPromptShown: () => void;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleAppLock: (appName: string, bundleId: string) => void;
  completeSetupGuide: () => void;
}

const defaultGameStats: Record<GameType, GameStats> = {
  math: { played: 0, won: 0, bestTime: 999 },
};

const defaultPhysicalStats: Record<PhysicalTaskType, PhysicalTaskStats> = {
  pushups: { completed: 0, totalReps: 0 },
  squats: { completed: 0, totalReps: 0 },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lastAppVersion: APP_VERSION,
      onboardingComplete: false,
      userName: '',
      userStruggles: [],
      ageBand: null,
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
      physicalStats: { ...defaultPhysicalStats },
      lockedApps: [],
      dailyGamesCompleted: 0,
      dailyEarnTasksCompleted: 0,
      dailyDate: '',
      appsUnlocked: false,
      setupGuideComplete: false,
      credits: 0,
      totalXpEarned: 0,
      unlockExpiresAt: null,
      reviewPromptShownAt: null,
      showPaywall: false,
      settings: {
        enabledGames: ['math'],
        challengesRequired: 1,
        activeHoursStart: 0,
        activeHoursEnd: 24,
        hapticFeedback: true,
        soundEnabled: true,
        screenTimeAuthorized: false,
        screenTimeAppCount: 0,
        screenTimeScheduleEnabled: false,
        activeDays: [true, true, true, true, true, true, true],
        theme: 'light',
        disableDifficulty: 'easy',
      },

      completeOnboarding: () => set({ onboardingComplete: true }),

      setUserName: (name) => set({ userName: name }),

      setUserStruggles: (struggles) => set({ userStruggles: struggles }),

      setAgeBand: (ageBand) => set({ ageBand }),

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

      recordPhysicalTask: (type, reps) => {
        const { physicalStats } = get();
        const current = physicalStats[type];
        const updated = {
          ...physicalStats,
          [type]: {
            completed: current.completed + 1,
            totalReps: current.totalReps + reps,
          },
        };
        set({ physicalStats: updated });
        const reward = REPS_TO_REWARD[reps] ?? Math.floor(reps / 2);
        get().earnReward(reward);
        get().addPoints(reward);

        // Count toward daily earn limit
        const today = new Date().toISOString().split('T')[0];
        const { dailyDate, dailyEarnTasksCompleted } = get();
        const count = dailyDate === today ? dailyEarnTasksCompleted + 1 : 1;
        set({ dailyEarnTasksCompleted: count, dailyDate: today });
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

      setShowPaywall: (show) => set({ showPaywall: show }),

      canEarnToday: () => {
        const { isPremium, dailyEarnTasksCompleted, dailyDate } = get();
        if (isPremium) return true;
        const today = new Date().toISOString().split('T')[0];
        const count = dailyDate === today ? dailyEarnTasksCompleted : 0;
        return count < FREE_DAILY_EARN_LIMIT;
      },

      canPlayGame: () => get().canEarnToday(),

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
        const expiresAt = Date.now() + UNLOCK_MINUTES * 60 * 1000;
        set({ credits: credits - amount, appsUnlocked: true, unlockExpiresAt: expiresAt });
        try {
          const { ScreenTime } = require('screen-time-module');
          ScreenTime.removeShieldNow().catch(() => { });
          ScreenTime.setAppsUnlocked(true).catch(() => { });
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

      checkUnlockExpiry: () => {
        const { unlockExpiresAt, appsUnlocked } = get();
        if (appsUnlocked && unlockExpiresAt && Date.now() > unlockExpiresAt) {
          set({ appsUnlocked: false, unlockExpiresAt: null });
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.applyShieldNow().catch(() => { });
            ScreenTime.setAppsUnlocked(false).catch(() => { });
          } catch { }
        }
      },

      markReviewPromptShown: () => set({ reviewPromptShownAt: Date.now() }),

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
      version: 3,
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
            physicalStats: state.physicalStats ?? { ...defaultPhysicalStats },
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
        return state;
      },
    }
  )
);
