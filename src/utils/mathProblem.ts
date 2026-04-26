export type Operation = '+' | '-' | '×' | '÷';
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

function bandFor(difficulty: Difficulty, round: number): DifficultyBand {
  // Each difficulty has its own number ranges AND operation mix.
  // Round nudges things up within the band but stays in the band.
  if (difficulty === 'easy') {
    return {
      ops: ['+', '-'],
      addSubMax: round <= 5 ? 12 : 20,
      multMax: 0,
      optionSpread: 5,
    };
  }
  if (difficulty === 'medium') {
    return {
      ops: round <= 3 ? ['+', '-'] : ['+', '-', '×'],
      addSubMax: round <= 5 ? 40 : 75,
      multMax: round <= 5 ? 10 : 12,
      optionSpread: 8,
    };
  }
  // hard
  return {
    ops: round <= 2 ? ['+', '-', '×'] : ['+', '-', '×', '÷'],
    addSubMax: round <= 3 ? 80 : round <= 6 ? 150 : 250,
    multMax: round <= 3 ? 12 : 15,
    optionSpread: 12,
  };
}

/** Generate a math problem scaled by both difficulty and round (1-based). */
export function generateProblem(round: number, difficulty: Difficulty = 'medium'): Problem {
  const band = bandFor(difficulty, round);
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
