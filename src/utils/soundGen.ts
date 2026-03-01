import { File, Directory, Paths } from 'expo-file-system';

const SAMPLE_RATE = 22050;

/** Create a WAV file buffer from PCM samples */
function createWav(samples: number[]): Uint8Array {
  const numSamples = samples.length;
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data chunk
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

function sine(freq: number, duration: number, volume = 0.5, decay = true): number[] {
  const len = Math.floor(SAMPLE_RATE * duration);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = decay ? Math.max(0, 1 - t / duration) : 1;
    samples.push(Math.sin(2 * Math.PI * freq * t) * volume * envelope);
  }
  return samples;
}

function genTap(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.03);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const env = Math.max(0, 1 - i / len);
    samples.push((Math.random() * 2 - 1) * 0.3 * env * env);
  }
  return samples;
}

function genCorrect(): number[] {
  const tone1 = sine(880, 0.1, 0.4);
  const gap = new Array(Math.floor(SAMPLE_RATE * 0.02)).fill(0);
  const tone2 = sine(1320, 0.15, 0.35);
  return [...tone1, ...gap, ...tone2];
}

function genWrong(): number[] {
  const tone1 = sine(350, 0.1, 0.35);
  const gap = new Array(Math.floor(SAMPLE_RATE * 0.02)).fill(0);
  const tone2 = sine(250, 0.15, 0.3);
  return [...tone1, ...gap, ...tone2];
}

function genComplete(): number[] {
  const freqs = [523.25, 659.25, 783.99, 1046.5];
  let samples: number[] = [];
  for (const freq of freqs) {
    samples = [...samples, ...sine(freq, 0.12, 0.35)];
    samples = [...samples, ...new Array(Math.floor(SAMPLE_RATE * 0.02)).fill(0)];
  }
  samples = [...samples, ...sine(1046.5, 0.2, 0.25)];
  return samples;
}

function genFail(): number[] {
  const freqs = [392, 329.63, 261.63];
  let samples: number[] = [];
  for (const freq of freqs) {
    samples = [...samples, ...sine(freq, 0.12, 0.25)];
    samples = [...samples, ...new Array(Math.floor(SAMPLE_RATE * 0.02)).fill(0)];
  }
  return samples;
}

function genCountdown(): number[] {
  return sine(1200, 0.06, 0.3);
}

function genRound(): number[] {
  const len = Math.floor(SAMPLE_RATE * 0.12);
  const samples: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 400 + (1200 - 400) * (i / len);
    const env = Math.sin((Math.PI * i) / len);
    samples.push(Math.sin(2 * Math.PI * freq * t) * 0.25 * env);
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
 * Skips generation if files already exist.
 */
export function generateSoundFiles(): Record<string, string> {
  const soundsDir = new Directory(Paths.cache, 'sounds');
  if (!soundsDir.exists) {
    soundsDir.create({ intermediates: true });
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
