/**
 * Flag → country bank for the Flags challenge. Uses unicode regional-indicator
 * emoji so no image assets are needed. The game shows `flag` and the player
 * picks `country` from 4 options (3 distractors drawn from this list at runtime).
 */
export interface FlagEntry {
  flag: string;
  country: string;
}

export const FLAGS: FlagEntry[] = [
  { flag: '🇫🇷', country: 'France' },
  { flag: '🇩🇪', country: 'Germany' },
  { flag: '🇮🇹', country: 'Italy' },
  { flag: '🇪🇸', country: 'Spain' },
  { flag: '🇬🇧', country: 'United Kingdom' },
  { flag: '🇺🇸', country: 'United States' },
  { flag: '🇨🇦', country: 'Canada' },
  { flag: '🇧🇷', country: 'Brazil' },
  { flag: '🇲🇽', country: 'Mexico' },
  { flag: '🇯🇵', country: 'Japan' },
  { flag: '🇨🇳', country: 'China' },
  { flag: '🇰🇷', country: 'South Korea' },
  { flag: '🇮🇳', country: 'India' },
  { flag: '🇷🇺', country: 'Russia' },
  { flag: '🇦🇺', country: 'Australia' },
  { flag: '🇳🇿', country: 'New Zealand' },
  { flag: '🇿🇦', country: 'South Africa' },
  { flag: '🇳🇬', country: 'Nigeria' },
  { flag: '🇪🇬', country: 'Egypt' },
  { flag: '🇦🇷', country: 'Argentina' },
  { flag: '🇳🇱', country: 'Netherlands' },
  { flag: '🇸🇪', country: 'Sweden' },
  { flag: '🇳🇴', country: 'Norway' },
  { flag: '🇨🇭', country: 'Switzerland' },
  { flag: '🇵🇹', country: 'Portugal' },
  { flag: '🇬🇷', country: 'Greece' },
  { flag: '🇹🇷', country: 'Turkey' },
  { flag: '🇸🇦', country: 'Saudi Arabia' },
  { flag: '🇦🇪', country: 'UAE' },
  { flag: '🇹🇭', country: 'Thailand' },
  { flag: '🇻🇳', country: 'Vietnam' },
  { flag: '🇮🇪', country: 'Ireland' },
  { flag: '🇵🇱', country: 'Poland' },
  { flag: '🇵🇰', country: 'Pakistan' },
];
