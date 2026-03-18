import { requireOptionalNativeModule } from 'expo-modules-core';
import { useStore } from '../store/useStore';
import { generateSoundFiles } from './soundGen';

type SoundName = 'tap' | 'correct' | 'wrong' | 'complete' | 'fail' | 'countdown' | 'round';

// Safe check that works with both old bridge and new architecture (TurboModules).
// Returns null instead of crashing if the native module isn't linked (e.g. Expo Go).
const nativeAVAvailable = requireOptionalNativeModule('ExponentAV') !== null;

let AudioModule: any = null;
const sounds: Partial<Record<SoundName, any>> = {};
let initialized = false;

/**
 * Generate sound files, configure audio mode, and preload all sounds.
 * Safe to call multiple times (idempotent). Non-blocking — audio failures
 * should never prevent the app from working.
 */
export async function preloadSounds(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!nativeAVAvailable) {
    console.warn('[Sound] ExponentAV not available — skipping audio');
    return;
  }

  try {
    const { Audio } = require('expo-av');
    AudioModule = Audio;

    await AudioModule.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    let uris: Record<string, string>;
    try {
      uris = generateSoundFiles();
    } catch (e) {
      console.warn('[Sound] Failed to generate sound files:', e);
      return;
    }

    // Unload any previously loaded sounds (handles regeneration)
    await Promise.all(
      Object.values(sounds).map(async (s) => {
        try { await s?.unloadAsync(); } catch { /* ignore */ }
      })
    );

    let loaded = 0;
    await Promise.all(
      (Object.entries(uris) as [SoundName, string][]).map(async ([name, uri]) => {
        try {
          const { sound } = await AudioModule.Sound.createAsync(
            { uri },
            { volume: 0.7 },
          );
          sounds[name] = sound;
          loaded++;
        } catch (e) {
          console.warn(`[Sound] Failed to load: ${name}`, e);
        }
      })
    );
    console.log(`[Sound] Loaded ${loaded}/7 sounds`);
  } catch (e) {
    console.warn('[Sound] Audio init failed:', e);
    AudioModule = null;
  }
}

async function play(name: SoundName): Promise<void> {
  if (!AudioModule) return;
  if (!useStore.getState().settings.soundEnabled) return;
  const sound = sounds[name];
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Silently fail — audio should never break gameplay
  }
}

export function soundTap() { play('tap'); }
export function soundCorrect() { play('correct'); }
export function soundWrong() { play('wrong'); }
export function soundComplete() { play('complete'); }
export function soundFail() { play('fail'); }
export function soundCountdown() { play('countdown'); }
export function soundRound() { play('round'); }
