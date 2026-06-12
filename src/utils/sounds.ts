import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useStore } from '../store/useStore';
import { generateSoundFiles } from './soundGen';

type SoundName = 'tap' | 'correct' | 'wrong' | 'complete' | 'fail' | 'countdown' | 'round';

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let initialized = false;

/**
 * Generate sound files, configure audio mode, and create a player per sound.
 * Safe to call multiple times (idempotent). Non-blocking — audio failures
 * should never prevent the app from working.
 */
export async function preloadSounds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    // playsInSilentMode keeps game SFX audible even with the ringer switch off;
    // mixWithOthers lets the user's music keep playing underneath.
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });

    let uris: Record<string, string>;
    try {
      uris = generateSoundFiles();
    } catch (e) {
      console.warn('[Sound] Failed to generate sound files:', e);
      return;
    }

    let loaded = 0;
    for (const [name, uri] of Object.entries(uris) as [SoundName, string][]) {
      try {
        const player = createAudioPlayer({ uri });
        player.volume = 1.0;
        players[name] = player;
        loaded++;
      } catch (e) {
        console.warn(`[Sound] Failed to load: ${name}`, e);
      }
    }
    console.log(`[Sound] Loaded ${loaded}/7 sounds`);
  } catch (e) {
    console.warn('[Sound] Audio init failed:', e);
  }
}

function play(name: SoundName): void {
  if (!useStore.getState().settings.soundEnabled) return;
  const player = players[name];
  if (!player) return;
  try {
    // Restart from the top so rapid re-triggers (fast taps) always fire.
    player.seekTo(0);
    player.play();
  } catch {
    // Silently fail — audio should never break gameplay.
  }
}

export function soundTap() { play('tap'); }
export function soundCorrect() { play('correct'); }
export function soundWrong() { play('wrong'); }
export function soundComplete() { play('complete'); }
export function soundFail() { play('fail'); }
export function soundCountdown() { play('countdown'); }
export function soundRound() { play('round'); }
