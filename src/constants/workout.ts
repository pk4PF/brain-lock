// ─────────────────────────────────────────────────────────────
// Today's Brain Workout - a set of three reps that ROTATES daily. The set is
// derived deterministically from the calendar day (a sliding window over the
// pool), so it's the same all day but different tomorrow. Completion is
// tracked in the store (`dailyWorkoutDone`, reset at midnight) and marked
// from `recordGame` whenever one of today's games finishes. Finishing all
// three awards a Brainpower bonus.
// ─────────────────────────────────────────────────────────────

export interface WorkoutItem {
  key: string;       // game key (matches recordGame's game arg + route)
  label: string;
  blurb: string;
  route: string;
}

// Pool ordered so any 3 consecutive entries mix the cognitive areas.
const POOL: WorkoutItem[] = [
  { key: 'cup-shuffle', label: 'Follow the Ball', blurb: 'Attention', route: '/games/cup-shuffle' },
  { key: 'tile-recall', label: 'Memory Tiles', blurb: 'Memory', route: '/games/tile-recall' },
  { key: 'general-knowledge', label: 'Knowledge Quiz', blurb: 'Knowledge', route: '/games/general-knowledge' },
  { key: 'color-match', label: 'Color Match', blurb: 'Attention', route: '/games/color-match' },
  { key: 'memory', label: 'Memory Match', blurb: 'Memory', route: '/games/memory' },
  { key: 'flags', label: 'Flags', blurb: 'Knowledge', route: '/games/flags' },
  { key: 'chimp', label: 'Chimp Test', blurb: 'Memory', route: '/games/chimp' },
  { key: 'math', label: 'Quick Math', blurb: 'Problem solving', route: '/games/math' },
];

/** Days since the Unix epoch for a YYYY-MM-DD string (the store's dailyDate). */
function dayNumber(dateStr: string): number {
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  return Number.isNaN(t) ? 0 : Math.floor(t / 86400000);
}

/** The three games for the given day (sliding window over the pool). */
export function getTodaysWorkout(dateStr: string): WorkoutItem[] {
  const n = POOL.length;
  const start = ((dayNumber(dateStr) % n) + n) % n;
  return [POOL[start], POOL[(start + 1) % n], POOL[(start + 2) % n]];
}

export function getTodaysWorkoutKeys(dateStr: string): string[] {
  return getTodaysWorkout(dateStr).map((w) => w.key);
}

/** Brainpower bonus for finishing the full workout. */
export const WORKOUT_REWARD = 12;
