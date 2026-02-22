export type Operation = '+' | '-' | '×';

export interface Problem {
  a: number;
  b: number;
  op: Operation;
  answer: number;
  options: number[];
}

export function generateProblem(difficulty: 'easy' | 'medium' | 'hard'): Problem {
  const ops: Operation[] =
    difficulty === 'easy' ? ['+', '-'] : ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;
  const max = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 50 : 100;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * max) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * (difficulty === 'hard' ? 15 : 12)) + 2;
      b = Math.floor(Math.random() * (difficulty === 'hard' ? 15 : 12)) + 2;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (offset === 0 ? 1 : offset);
    if (wrong !== answer && wrong >= 0) wrongAnswers.add(wrong);
  }

  const options = [...wrongAnswers, answer].sort(() => Math.random() - 0.5);
  return { a, b, op, answer, options };
}
