import { useLocalSearchParams } from 'expo-router';
import { useStore, DIFFICULTY_UNLOCK_MINUTES } from '../store/useStore';
import type { Difficulty } from '../constants/games';

/**
 * Brainlock 2.0 challenge → unlock glue. A game/challenge is launched from the
 * unlock flow as `/games/<key>?unlock=1&difficulty=<easy|medium|hard>`. This
 * hook reads those params and exposes a `doUnlock()` to call once the user
 * passes — it unlocks the blocked apps for the difficulty's duration.
 *
 * When `isUnlock` is false the game is just practice (from the Tests tab) and
 * passing unlocks nothing.
 */
export function useChallengeUnlock() {
  const params = useLocalSearchParams<{ unlock?: string; difficulty?: string }>();
  const isUnlock = params.unlock === '1';
  const difficulty: Difficulty =
    params.difficulty === 'medium' || params.difficulty === 'hard'
      ? params.difficulty
      : 'easy';
  const unlockMinutes = DIFFICULTY_UNLOCK_MINUTES[difficulty];
  const unlockApps = useStore((s) => s.unlockApps);

  /** Unlock the blocked apps for this difficulty's duration. No-op in practice. */
  const doUnlock = () => {
    if (isUnlock) unlockApps(difficulty);
  };

  return { isUnlock, difficulty, unlockMinutes, doUnlock };
}
