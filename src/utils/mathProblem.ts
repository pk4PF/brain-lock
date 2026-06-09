export type Operation = '+' | '-' | '×' | '÷';
// Difficulty modes were removed - math is now a single progressive curve.
// Type kept for back-compat with any stale imports; no longer used by the
// generator.
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Problem {
  a: number;
  b: number;
  op: Operation;
  answer: number;
  options: number[];
}

interface DifficultyBand {
  ops: Operation[];
  /** Floor for + / - operands. Without this, the uniform picker keeps
   *  producing trivial small-number problems even when the ceiling is high. */
  addSubMin: number;
  addSubMax: number;
  /** Floor for × / ÷ operands. Forces real two-digit-times-one-digit
   *  problems (13 × 9) instead of fall-back-on-times-tables (3 × 5). */
  multMin: number;
  multMax: number;
  optionSpread: number;
}

/**
 * Single progressive curve, rounds 1-12. Hard means hard:
 *   - Warm-up: two-digit add/sub, multiplication up to 12×12, no division.
 *   - Mid: two-digit add/sub up to 99, multiplication 6-13, division.
 *   - Late: 3-digit subtraction (240 - 132 style), multiplication 9-15
 *     (forces non-memorised products like 13 × 9 = 117), tight options.
 *
 * Floors on every band so the generator can't accidentally produce a
 * trivial problem mid-game.
 */
function bandFor(round: number): DifficultyBand {
  if (round <= 3) {
    return {
      ops: ['+', '-', '×'],
      addSubMin: 12,
      addSubMax: 50,
      multMin: 4,
      multMax: 12,
      optionSpread: 3,
    };
  }
  if (round <= 6) {
    return {
      ops: ['+', '-', '×', '÷'],
      addSubMin: 30,
      addSubMax: 99,
      multMin: 6,
      multMax: 13,
      optionSpread: 3,
    };
  }
  // Late band - this is where it bites.
  return {
    ops: ['+', '-', '×', '÷'],
    addSubMin: 80,
    addSubMax: 250,
    multMin: 9,
    multMax: 15,
    optionSpread: 2,
  };
}

/** Inclusive random int in [min, max]. */
function randIntInclusive(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/** Generate a math problem on the progressive single-mode curve.
 *  The legacy `_difficulty` parameter is accepted but ignored. */
export function generateProblem(round: number, _difficulty?: Difficulty): Problem {
  const band = bandFor(round);
  const op = band.ops[Math.floor(Math.random() * band.ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = randIntInclusive(band.addSubMin, band.addSubMax);
      b = randIntInclusive(band.addSubMin, band.addSubMax);
      answer = a + b;
      break;
    case '-': {
      // Pick a in the band, then constrain b so the subtraction is
      // meaningful. b lands in [addSubMin/2, a - addSubMin/2] which
      // means you never get `240 - 3` (trivial) or `200 - 197` (trick).
      a = randIntInclusive(band.addSubMin, band.addSubMax);
      const halfMin = Math.max(1, Math.floor(band.addSubMin / 2));
      const bMax = Math.max(halfMin, a - halfMin);
      b = randIntInclusive(halfMin, bMax);
      answer = a - b;
      break;
    }
    case '×':
      a = randIntInclusive(band.multMin, band.multMax);
      b = randIntInclusive(band.multMin, band.multMax);
      answer = a * b;
      break;
    case '÷': {
      // Build from the answer so we always get clean integer results.
      // Both divisor and quotient drawn from [multMin, multMax] so the
      // dividend can be sizeable (e.g. 12 × 9 = 108, then 108 ÷ 9 = 12).
      const divisor = randIntInclusive(band.multMin, band.multMax);
      const quotient = randIntInclusive(band.multMin, band.multMax);
      a = divisor * quotient;
      b = divisor;
      answer = quotient;
      break;
    }
    default:
      a = 1; b = 1; answer = 2;
  }

  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = Math.floor(Math.random() * (band.optionSpread * 2 + 1)) - band.optionSpread;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong !== answer && wrong >= 0) wrongAnswers.add(wrong);
  }

  const options = [...wrongAnswers, answer].sort(() => Math.random() - 0.5);
  return { a, b, op, answer, options };
}
