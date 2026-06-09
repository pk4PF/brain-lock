// Widened from `'math'` to all live game keys so per-game lifetime
// stats (`gameStats[type]`) populate for every game, not just math.
// The keys mirror the routes under `app/games/*.tsx` and the
// GameAccents palette in `theme.ts`.
export type GameType =
  | 'math'
  | 'memory'
  | 'word-recall'
  | 'focus'
  // Day-1 launch batch: one new game per cognitive area.
  | 'sequence'      // memory   - tap-sequence (Simon)
  | 'anagram'       // recall   - unscramble letters
  | 'color-match'   // attention - Stroop (word vs ink colour)
  | 'block-tap'     // speed     - tap targets as they appear
  | 'number-seq'    // problemSolving - "2, 4, 6, ?"
  | 'tile-recall'   // memory (spatial) - Corsi block-tapping. Hero marketing game.
  // Viral batch: sudden-death, escalating, built to be watched in clips.
  | 'chimp'         // memory   - memorise numbered tiles, tap in order (Chimp Test)
  | 'cup-shuffle'   // attention - follow the ball under shuffling cups
  | 'schulte'       // attention - tap 1→25 on a scrambled grid before the clock
  // Quiz challenges (Brainlock 2.0)
  | 'general-knowledge' // trivia - multiple-choice general knowledge
  | 'flags';            // identify the country from its flag
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

// Partial - we only configure the legacy `math` entry here. The newer
// games (memory, focus, word-recall) carry their own metadata
// inline in their respective screens; this map is kept for the legacy
// `app/challenge/index.tsx` flow only.
export const GAMES: Partial<Record<GameType, GameConfig>> = {
  math: {
    id: 'math',
    title: 'Math Blitz',
    description: 'Beat the clock with mental math',
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
