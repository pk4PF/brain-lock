export type Operation = '+' | '-' | '×' | '÷';
// Difficulty modes were removed — math is now a single progressive curve.
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
  addSubMax: number;
  multMax: number;
  optionSpread: number;
}

/**
 * Single progressive curve, rounds 1–10. We deliberately stop short of
 * "hard": no division (it's a confidence-killer), multiplication caps at
 * 10×10. The curve goes "easy warm-up → medium core → light challenge"
 * so the game stays approachable for the casual brain-game audience.
 */
function bandFor(round: number): DifficultyBand {
  if (round <= 3) {
    // Warm-up: simple + and -
    return { ops: ['+', '-'], addSubMax: 15, multMax: 0, optionSpread: 5 };
  }
  if (round <= 6) {
    // Mid: introduces multiplication, slightly bigger numbers
    return { ops: ['+', '-', '×'], addSubMax: 30, multMax: 8, optionSpread: 7 };
  }
  // Late: bigger numbers, still no division
  return { ops: ['+', '-', '×'], addSubMax: 60, multMax: 10, optionSpread: 9 };
}

/** Generate a math problem on the progressive single-mode curve.
 *  The legacy `_difficulty` parameter is accepted but ignored. */
export function generateProblem(round: number, _difficulty?: Difficulty): Problem {
  const band = bandFor(round);
  const op = band.ops[Math.floor(Math.random() * band.ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * band.addSubMax) + 1;
      b = Math.floor(Math.random() * band.addSubMax) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * band.addSubMax) + 2;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×': {
      const max = Math.max(2, band.multMax);
      a = Math.floor(Math.random() * (max - 1)) + 2;
      b = Math.floor(Math.random() * (max - 1)) + 2;
      answer = a * b;
      break;
    }
    case '÷': {
      // Build from the answer so we always get clean integer results.
      const max = Math.max(3, band.multMax);
      const divisor = Math.floor(Math.random() * (max - 1)) + 2;
      const quotient = Math.floor(Math.random() * (max - 1)) + 2;
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
