import type { Difficulty } from './games';

/**
 * Per-game difficulty thresholds. Difficulty is chosen at unlock/practice time
 * and scales how hard each challenge is to PASS — Easy is achievable, Hard is
 * genuinely demanding. Tune everything here.
 */

// Accuracy bar for question/round games (math, anagram, color-match,
// number-seq, word-recall, focus). Hard = flawless.
export const ACCURACY_PASS: Record<Difficulty, number> = { easy: 0.6, medium: 0.8, hard: 1 };

export function passByAccuracy(correct: number, total: number, d: Difficulty): boolean {
  return total > 0 && correct / total >= ACCURACY_PASS[d];
}

// Level you must reach to pass the escalating memory games. Hard is
// deliberately steep - the previous 8/9/8 felt achievable on the first
// try, which means passing didn't mean anything.
export const TILE_LEVEL: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 10 };
export const CHIMP_LEVEL: Record<Difficulty, number> = { easy: 5, medium: 7, hard: 11 };
export const SEQUENCE_LEVEL: Record<Difficulty, number> = { easy: 4, medium: 6, hard: 10 };

// Rounds you must survive in Follow the Ball (also the game's win cap).
// Hard now requires 12 rounds of sustained visual attention.
export const CUP_TARGET: Record<Difficulty, number> = { easy: 3, medium: 5, hard: 12 };

// Average tap-target time (ms) you must beat — lower = harder. Hard
// pushed from 550 to 400 - sub-half-second average requires real focus.
export const BLOCKTAP_MS: Record<Difficulty, number> = { easy: 1000, medium: 750, hard: 400 };

// Time (s) to clear Memory Match under — lower = harder. With 8 pairs
// (16 cards), 22s is a tight ceiling that only rewards real recall.
export const MEMORY_SECONDS: Record<Difficulty, number> = { easy: 90, medium: 60, hard: 22 };

// Countdown (s) for Beat the Grid (Schulte) — lower = harder. 22s for
// a 5×5 grid is a stretch for most people; that's the point.
export const SCHULTE_LIMIT: Record<Difficulty, number> = { easy: 60, medium: 45, hard: 22 };
