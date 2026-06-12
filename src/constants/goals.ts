// Shared mapping for the onboarding "what would you do with your time back"
// goals, used to echo the user's pick back on the plan + paywall screens.
// Single source of truth so the two screens can't drift.

export const GOAL_PHRASES: Record<string, string> = {
  read: 'read more',
  sleep: 'sleep better',
  workout: 'work out',
  present: 'be more present',
  learn: 'learn new things',
  family: 'be with your family',
  work: 'focus on work',
  creative: 'create',
};

// Custom answers are stored with this prefix (see app/onboarding/goal.tsx).
const CUSTOM_PREFIX = 'custom:';

/** Map a stored goal value to a short echo phrase. Handles custom entries. */
export function goalToPhrase(value: string): string | null {
  if (value.startsWith(CUSTOM_PREFIX)) {
    const t = value.slice(CUSTOM_PREFIX.length).trim().toLowerCase();
    return t.length > 0 ? t : null;
  }
  return GOAL_PHRASES[value] ?? null;
}

/** First `max` goals as echo phrases (custom-aware), empty entries dropped. */
export function goalPhrases(values: string[], max = 2): string[] {
  return values
    .map(goalToPhrase)
    .filter((p): p is string => !!p)
    .slice(0, max);
}
