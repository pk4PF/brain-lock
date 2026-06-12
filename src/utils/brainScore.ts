// ─────────────────────────────────────────────────────────────
// Brainpower Score
// A single 0-100 number where HIGHER = better (sharper). 0 = fully brain
// rotted, 100 = elite. Built from the two things we track:
//   • daily screen time (self-reported)  — pulls it DOWN
//   • training in the Brain Gym           — pushes it UP
// Unlocking apps to scroll lowers it; training raises it. One legible
// number you want to push UP — and it's natively shareable.
// ─────────────────────────────────────────────────────────────

export interface BrainScoreResult {
  /** 0-100, higher = sharper/better. */
  score: number;
  /** Punchy label for the band. */
  label: string;
  /** One emoji that matches the band (used on the share card). */
  emoji: string;
}

// Each band: [minScore, label, emoji]. Checked high → low. High = good.
const BANDS: [number, string, string][] = [
  [80, 'Elite', '⚡'],
  [60, 'Locked In', '🔒'],
  [40, 'Mid', '😐'],
  [20, 'Brain rotted', '🫠'],
  [0, 'Brain Dead', '💀'],
];

export function scoreBand(score: number): { label: string; emoji: string } {
  for (const [min, label, emoji] of BANDS) {
    if (score >= min) return { label, emoji };
  }
  return { label: 'Brain Dead', emoji: '💀' };
}

export interface Rank {
  name: string;
  emoji: string;
  index: number;     // 0 = lowest rank
  floor: number;     // score where this rank starts
  isMax: boolean;
  progress: number;  // 0-1 toward the next rank
  toNext: number;    // points to the next rank (0 if max)
  nextName: string | null;
  nextEmoji: string | null;
}

// The rank ladder = the score bands, ascending. "How close to next rank" is
// just how far through the current band you are.
const RANK_LADDER = [...BANDS].slice().reverse(); // low → high

export function getRank(score: number): Rank {
  let i = 0;
  for (let k = 0; k < RANK_LADDER.length; k++) {
    if (score >= RANK_LADDER[k][0]) i = k;
  }
  const [floor, name, emoji] = RANK_LADDER[i];
  const next = RANK_LADDER[i + 1];
  const isMax = !next;
  const span = isMax ? 1 : next[0] - floor;
  const progress = isMax ? 1 : Math.max(0, Math.min(1, (score - floor) / span));
  return {
    name,
    emoji,
    index: i,
    floor,
    isMax,
    progress,
    toNext: isMax ? 0 : Math.max(0, next[0] - score),
    nextName: next ? next[1] : null,
    nextEmoji: next ? next[2] : null,
  };
}

/**
 * Estimate the Brainpower Score before the benchmark is taken, from screen time
 * + games played. Higher = better.
 */
export function brainScoreEstimate(screenTimeHours: number, gamesPlayed: number): BrainScoreResult {
  const hours = screenTimeHours > 0 ? screenTimeHours : 4;
  const damage = hours * 10;        // 4h → 40 of damage
  const trained = gamesPlayed * 2;  // each game claws 2 back
  const rot = Math.max(0, Math.min(100, Math.round(damage - trained)));
  const score = 100 - rot;          // invert: high = good
  return { score, ...scoreBand(score) };
}

/**
 * Brain Age — a fun, aspirational metric. Score 100 → age 18, score 0 → age 65.
 * Higher brainpower = younger brain age. Not clinical.
 */
export function getBrainAge(score: number): number {
  return Math.round(65 - (score / 100) * 47);
}

/** Short caption for the native share sheet (text alongside the image). */
export function brainScoreShareMessage(result: BrainScoreResult): string {
  return `My Brainpower Score is ${result.score}/100 (${result.label}). Think you can beat it? Brainlock.`;
}
