import { File, Directory, Paths } from 'expo-file-system';

const SAMPLE_RATE = 44100;

/** Create a WAV file buffer from PCM samples */
function createWav(samples: number[]): Uint8Array {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ── Waveform helpers ──────────────────────────────────────────

/** Sine wave with optional harmonics for warmth */
function warmTone(freq: number, duration: number, volume = 0.3): number[] {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    // Smooth fade-in (5ms) and fade-out envelope
    const fadeIn = Math.min(1, i / (SAMPLE_RATE * 0.005));
    const fadeOut = Math.max(0, 1 - (t / duration) ** 0.6);
    const env = fadeIn * fadeOut;
    // Fundamental + soft 2nd harmonic + tiny 3rd for body
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.7 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.2 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.1;
    samples.push(wave * volume * env);
  }
  return samples;
}

/** Mix two sample arrays together */
function mix(a: number[], b: number[], bOffset = 0): number[] {
  const len = Math.max(a.length, b.length + bOffset);
  const out: number[] = new Array(len).fill(0);
  for (let i = 0; i < a.length; i++) out[i] += a[i];
  for (let i = 0; i < b.length; i++) {
    if (i + bOffset < len) out[i + bOffset] += b[i];
  }
  return out;
}

// ── Sound generators ──────────────────────────────────────────

/** Snappy bubble-pop tap - punchy click with a bright tonal body */
function genTap(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.05);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 90); // punchy decay with a touch more body
    // Brighter pop: pitch drops quickly for a satisfying "bloop"
    const freq = 900 - 400 * Math.min(1, t / 0.03);
    const noise = (Math.random() * 2 - 1) * 0.25;
    const tone = Math.sin(2 * Math.PI * freq * t) * 0.5;
    samples.push((noise + tone) * env * 0.9);
  }
  // Light low-pass to round off the harshness
  for (let i = 1; i < samples.length; i++) {
    samples[i] = samples[i] * 0.55 + samples[i - 1] * 0.45;
  }
  return samples;
}

/** Bright, rewarding ascending chime - punchy and satisfying */
function genCorrect(): number[] {
  const tone1 = warmTone(659, 0.11, 0.5);  // E5
  const tone2 = warmTone(988, 0.18, 0.45); // B5 — bright, poppy interval
  // Overlap for a quick, snappy two-note "ding-ding"
  let out = mix(tone1, tone2, Math.floor(SAMPLE_RATE * 0.06));
  // Tiny high sparkle on the tail for that satisfying mobile-game shimmer
  const sparkle = warmTone(1319, 0.1, 0.2); // E6
  out = mix(out, sparkle, Math.floor(SAMPLE_RATE * 0.13));
  return out;
}

/** Soft muffled low tone - communicates "nope" without jarring */
function genWrong(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.18);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 13);
    // Low fundamental with slight detuning for a defined "wrong" buzz
    const wave =
      Math.sin(2 * Math.PI * 220 * t) * 0.5 +
      Math.sin(2 * Math.PI * 226 * t) * 0.3 +
      Math.sin(2 * Math.PI * 165 * t) * 0.2;
    samples.push(wave * 0.42 * env);
  }
  return samples;
}

/** Musical success arpeggio - overlapping notes with decay tails */
function genComplete(): number[] {
  const notes = [
    { freq: 523, delay: 0 },     // C5
    { freq: 659, delay: 0.08 },  // E5
    { freq: 784, delay: 0.16 },  // G5
    { freq: 1047, delay: 0.26 }, // C6
  ];
  let result: number[] = [];
  for (const note of notes) {
    const tone = warmTone(note.freq, 0.22, 0.34);
    result = mix(result, tone, Math.floor(SAMPLE_RATE * note.delay));
  }
  // Add a sustained, bright final note for a triumphant finish
  const sustain = warmTone(1047, 0.34, 0.22);
  result = mix(result, sustain, Math.floor(SAMPLE_RATE * 0.36));
  return result;
}

/** Gentle descending - soft "aww" without being dramatic */
function genFail(): number[] {
  const notes = [
    { freq: 392, delay: 0 },     // G4
    { freq: 330, delay: 0.1 },   // E4
    { freq: 262, delay: 0.2 },   // C4
  ];
  let result: number[] = [];
  for (const note of notes) {
    const tone = warmTone(note.freq, 0.18, 0.3);
    result = mix(result, tone, Math.floor(SAMPLE_RATE * note.delay));
  }
  return result;
}

/** Subtle soft tick - not a piercing beep */
function genCountdown(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.04);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 80);
    // Soft mid-range click with tonal body
    const wave =
      Math.sin(2 * Math.PI * 800 * t) * 0.5 +
      Math.sin(2 * Math.PI * 400 * t) * 0.3 +
      (Math.random() * 2 - 1) * 0.2;
    samples.push(wave * 0.28 * env);
  }
  // Gentle low-pass
  for (let i = 1; i < samples.length; i++) {
    samples[i] = samples[i] * 0.5 + samples[i - 1] * 0.5;
  }
  return samples;
}

/** Quick soft whoosh for round transitions */
function genRound(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.1);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / len;
    // Gentle sweep from 300 to 600 Hz (not 400→1200 which was harsh)
    const freq = 300 + 300 * progress;
    const env = Math.sin(Math.PI * progress); // smooth bell curve
    const wave =
      Math.sin(2 * Math.PI * freq * t) * 0.6 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.25 +
      (Math.random() * 2 - 1) * 0.15; // tiny noise for texture
    samples.push(wave * 0.3 * env);
  }
  return samples;
}

const GENERATORS: Record<string, () => number[]> = {
  tap: genTap,
  correct: genCorrect,
  wrong: genWrong,
  complete: genComplete,
  fail: genFail,
  countdown: genCountdown,
  round: genRound,
};

/**
 * Generate all sound WAV files and write to cache directory.
 * Returns a map of sound name -> file URI.
 * Forces regeneration when sound version changes.
 */
export function generateSoundFiles(): Record<string, string> {
  const soundsDir = new Directory(Paths.cache, 'sounds');
  if (!soundsDir.exists) {
    soundsDir.create({ intermediates: true });
  }

  // Version marker — bump VERSION to force regeneration after changes.
  // Existence-based (sync) because File.text() is async and this fn is sync.
  const VERSION = '3';
  const versionFile = new File(soundsDir, `.sound-v${VERSION}`);

  if (!versionFile.exists) {
    // New version — clear stale wav files, then regenerate below.
    for (const [name] of Object.entries(GENERATORS)) {
      const old = new File(soundsDir, `${name}.wav`);
      if (old.exists) old.delete();
    }
    versionFile.create();
  }

  const uris: Record<string, string> = {};

  for (const [name, gen] of Object.entries(GENERATORS)) {
    const file = new File(soundsDir, `${name}.wav`);
    if (!file.exists) {
      const samples = gen();
      const wav = createWav(samples);
      file.create();
      file.write(wav);
    }
    uris[name] = file.uri;
  }

  return uris;
}
