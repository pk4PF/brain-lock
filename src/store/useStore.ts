import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameType } from '../constants/games';
import { ThemeMode } from '../constants/theme';

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

interface AppState {
  onboardingComplete: boolean;
  userName: string;
  userStruggles: string[];
  isPremium: boolean;
  subscriptionPlan: string | null;
  demoGameScore: number | null;
  progress: UserProgress;
  lockedApps: AppLockEntry[];
  settings: Settings;
  dailyGamesCompleted: number;
  dailyDate: string;
  appsUnlocked: boolean;
  setupGuideComplete: boolean;

  completeOnboarding: () => void;
  setUserName: (name: string) => void;
  setUserStruggles: (struggles: string[]) => void;
  setSubscription: (plan: string) => void;
  clearSubscription: () => void;
  setDemoGameScore: (score: number) => void;
  addPoints: (points: number) => void;
  recordGame: (game: GameType, won: boolean, timeTaken: number) => void;
  completeDailyGame: () => void;
  checkDailyReset: () => void;
  updateSettings: (partial: Partial<Settings>) => void;
  toggleAppLock: (appName: string, bundleId: string) => void;
  completeSetupGuide: () => void;
}

const defaultGameStats: Record<GameType, GameStats> = {
  math: { played: 0, won: 0, bestTime: 999 },
  memory: { played: 0, won: 0, bestTime: 999 },

  wordscramble: { played: 0, won: 0, bestTime: 999 },
  speedread: { played: 0, won: 0, bestTime: 999 },
  reaction: { played: 0, won: 0, bestTime: 999 },
  colormatch: { played: 0, won: 0, bestTime: 999 },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingComplete: false,
      userName: '',
      userStruggles: [],
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
      lockedApps: [],
      dailyGamesCompleted: 0,
      dailyDate: '',
      appsUnlocked: false,
      setupGuideComplete: false,
      settings: {
        enabledGames: ['math', 'memory', 'wordscramble', 'speedread', 'reaction', 'colormatch'],
        challengesRequired: 1,
        activeHoursStart: 0,
        activeHoursEnd: 23,
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
        const stats = { ...newProgress.gameStats[game] };
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

      completeDailyGame: () => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyDate, dailyGamesCompleted, settings: s } = get();
        const count = dailyDate === today ? dailyGamesCompleted + 1 : 1;
        const unlocked = count >= s.challengesRequired;
        set({ dailyGamesCompleted: count, dailyDate: today, appsUnlocked: unlocked });
        if (unlocked) {
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.removeShieldNow().catch(() => { });
            ScreenTime.setAppsUnlocked(true).catch(() => { });
          } catch { }
        }
      },

      checkDailyReset: () => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyDate, appsUnlocked } = get();
        if (dailyDate !== today) {
          set({ dailyGamesCompleted: 0, dailyDate: today, appsUnlocked: false });
          try {
            const { ScreenTime } = require('screen-time-module');
            ScreenTime.setAppsUnlocked(false).catch(() => { });
            ScreenTime.applyShieldNow().catch(() => { });
          } catch { }
        }
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
    }
  )
);
