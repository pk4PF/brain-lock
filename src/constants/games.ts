export type GameType = 'math' | 'memory' | 'wordscramble' | 'speedread' | 'reaction' | 'colormatch';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameCategory = 'speed' | 'memory' | 'focus' | 'problem_solving';

export interface GameConfig {
  id: GameType;
  title: string;
  description: string;
  category: GameCategory;
  color: string;
  gradient: [string, string];
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
  },
  memory: {
    id: 'memory',
    title: 'Memory Sequence',
    description: 'Pattern recall training',
    category: 'memory',
    color: '#00D4AA',
    gradient: ['#020B2E', '#0F2847'],
  },

  wordscramble: {
    id: 'wordscramble',
    title: 'Word Scramble',
    description: 'Vocabulary & speed',
    category: 'problem_solving',
    color: '#E8B84B',
    gradient: ['#1A1207', '#3D2B14'],
  },
  speedread: {
    id: 'speedread',
    title: 'Speed Reader',
    description: 'RSVP reading & comprehension',
    category: 'focus',
    color: '#FF6B35',
    gradient: ['#1A0A0A', '#3D1414'],
  },
  reaction: {
    id: 'reaction',
    title: 'Reaction Time',
    description: 'Test your reflexes',
    category: 'speed',
    color: '#FFD600',
    gradient: ['#0A0A1A', '#1E1E4D'],
  },
  colormatch: {
    id: 'colormatch',
    title: 'Color Match',
    description: 'Stroop effect challenge',
    category: 'problem_solving',
    color: '#FF69B4',
    gradient: ['#1A0A2E', '#3F1676'],
  },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; multiplier: number; timeLimit: number }> = {
  easy: { label: 'Easy', multiplier: 1, timeLimit: 30 },
  medium: { label: 'Medium', multiplier: 1.5, timeLimit: 20 },
  hard: { label: 'Hard', multiplier: 2, timeLimit: 15 },
};
