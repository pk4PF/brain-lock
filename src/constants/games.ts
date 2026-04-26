export type GameType = 'math';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameCategory = 'speed' | 'memory' | 'focus' | 'problem_solving';

export interface GameConfig {
  id: GameType;
  title: string;
  description: string;
  category: GameCategory;
  color: string;
  gradient: [string, string];
  lightGradient: [string, string];
}

export const CATEGORIES: Record<GameCategory, { label: string }> = {
  speed: { label: 'Speed' },
  memory: { label: 'Memory' },
  focus: { label: 'Focus' },
  problem_solving: { label: 'Problem Solving' },
};

export const GAMES: Record<GameType, GameConfig> = {
  math: {
    id: 'math',
    title: 'Math Blitz',
    description: 'Quick arithmetic challenges',
    category: 'speed',
    color: '#00F0FF',
    gradient: ['#0D0221', '#2D1B69'],
    lightGradient: ['#E6FDFF', '#C0F5FF'],
  },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; multiplier: number; timeLimit: number }> = {
  easy: { label: 'Easy', multiplier: 1, timeLimit: 30 },
  medium: { label: 'Medium', multiplier: 1.5, timeLimit: 20 },
  hard: { label: 'Hard', multiplier: 2, timeLimit: 15 },
};
