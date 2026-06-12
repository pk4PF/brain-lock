export interface ResultMessage {
  title: string;
  line: string;
}

export const PASS_MESSAGES: ResultMessage[] = [
  { title: 'Brain wins', line: 'Brain wins. Don\'t waste it doomscrolling.' },
  { title: 'Took you long enough', line: 'You earned this. Don\'t rot on TikTok with it.' },
  { title: 'You earned it', line: 'That time is yours - the feed can wait.' },
];

export const FAIL_MESSAGES: ResultMessage[] = [
  { title: 'Skill issue', line: 'Not sharp enough. Run it back.' },
  { title: 'Not quite', line: 'Close, but your brain needs more reps.' },
  { title: 'Access denied', line: 'Your brain gave up before you did.' },
];

/** Random verdict message from the appropriate bank. */
export function pickResultMessage(passed: boolean): ResultMessage {
  const bank = passed ? PASS_MESSAGES : FAIL_MESSAGES;
  return bank[Math.floor(Math.random() * bank.length)];
}
