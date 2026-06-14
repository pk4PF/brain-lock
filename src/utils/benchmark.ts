import { router } from 'expo-router';

// ─────────────────────────────────────────────────────────────
// The benchmark: a short sequence of distinct brain tests, one per
// cognitive aspect. The user plays each in turn; their raw scores are
// collected in the store (`benchmarkScores`) and composited into the
// Brainpower Score on the reveal screen (`app/benchmark-result.tsx`).
//
// Each game in the sequence reads `?benchmark=1&bm=<index>`, records its
// raw aspect score via `setBenchmarkScore`, then calls `advanceBenchmark`.
// ─────────────────────────────────────────────────────────────

export interface BenchmarkStep {
  route: string;
  label: string;
  query?: string; // extra params, e.g. a shorter round count for the benchmark
}

// Kept deliberately SIMPLE - quick, tap-only games so the benchmark feels
// effortless. Each game records its raw 0-100 score keyed by step index.
export const BENCHMARK_SEQUENCE: BenchmarkStep[] = [
  { route: '/games/tile-recall', label: 'Memory' },
  // Focus Flash plays a fixed set of rounds and scores by accuracy - a clean
  // attention measure that never bails early on a wrong tap (unlike the
  // streak-based cup game).
  { route: '/games/focus', label: 'Attention', query: 'rounds=6' },
  { route: '/games/math', label: 'Problem solving' },
];

export const BENCHMARK_LENGTH = BENCHMARK_SEQUENCE.length;

function urlFor(step: BenchmarkStep, index: number): string {
  return `${step.route}?benchmark=1&bm=${index}${step.query ? `&${step.query}` : ''}`;
}

/** Kick off the benchmark from step 0 (called by the Home / Score CTAs). */
export function startBenchmark() {
  router.push(urlFor(BENCHMARK_SEQUENCE[0], 0) as any);
}

/** Called by a benchmark game once it finishes. Advances to the next test,
 *  or to the reveal screen if this was the last. Uses replace so Back doesn't
 *  walk back through the chain of finished tests. */
export function advanceBenchmark(currentIndex: number) {
  const next = currentIndex + 1;
  if (next < BENCHMARK_SEQUENCE.length) {
    router.replace(urlFor(BENCHMARK_SEQUENCE[next], next) as any);
  } else {
    router.replace('/benchmark-result' as any);
  }
}

/**
 * Composite the collected raw aspect scores + screen time into the Brain
 * Score (higher = better). Strong cognitive performance pushes it up; heavy
 * screen time drags it down.
 */
export function computeBenchmarkScore(
  screenTimeHours: number,
  scores: Record<string, number>,
): number {
  const vals = Object.values(scores).filter((v): v is number => typeof v === 'number');
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const hours = screenTimeHours > 0 ? screenTimeHours : 4;
  // Cognitive performance is the primary driver: all-wrong → ~10, all-correct
  // → ~55 (top of the "Mid" band, leaving room to climb to Locked In / Elite
  // through training). Heavy self-reported screen time applies a modest penalty.
  const fromPerformance = (avg / 100) * 45 + 10; // 10..55
  const screenPenalty = Math.max(0, hours - 3) * 2; // 0 at <=3h, grows with use
  return Math.max(5, Math.min(55, Math.round(fromPerformance - screenPenalty)));
}
