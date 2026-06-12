/**
 * Verdict copy shown on the test result screen. A test now PASSES or FAILS
 * (see the credits >= 3 rule in each game's finishGame), and the result
 * headline + line are pulled from these banks at random.
 *
 * Tone spread is deliberate:
 *   PASS - one nice, one kinda mean, one full "don't doomscroll" warning.
 *          Every pass message reminds the user not to blow the cells on a feed.
 *   FAIL - dry, a little brutal. No cells earned.
 *
 * Pick once when the game finishes (store the result in component state) so
 * the headline doesn't reshuffle on re-render.
 */

export interface ResultMessage {
  title: string;
  line: string;
}

export const PASS_MESSAGES: ResultMessage[] = [
  // nice
  { title: 'Brain wins', line: 'Brain wins. Don’t waste it doomscrolling.' },
  // kinda mean
  { title: 'Took you long enough', line: 'You earned this. Don’t rot on TikTok with it.' },
  // full warning not to scroll
  { title: 'You earned it', line: 'That time is yours — the feed can wait.' },
];

export const FAIL_MESSAGES: ResultMessage[] = [
  { title: ‘Skill issue’, line: ‘Not sharp enough. Run it back.’ },
  { title: ‘Not quite’, line: ‘Close, but your brain needs more reps.’ },
  { title: ‘Access denied’, line: ‘Your brain gave up before you did.’ },
];

/** Random verdict message from the appropriate bank. */
export function pickResultMessage(passed: boolean): ResultMessage {
  const bank = passed ? PASS_MESSAGES : FAIL_MESSAGES;
  return bank[Math.floor(Math.random() * bank.length)];
}
