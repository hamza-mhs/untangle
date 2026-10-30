// Synthesizes the game sound set into assets/sounds/*.wav (16-bit mono PCM, 22.05 kHz).
// No downloaded assets — every sound is a few sine/triangle partials with an envelope.
// Run: node tools/sounds/generate.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'sounds');

const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const tri = (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));

/** Attack (s), then exponential decay with time constant `tau` (s). */
const env = (t, attack, tau) => (t < attack ? t / attack : Math.exp(-(t - attack) / tau));

/** One voice: start (s), length (s), sample fn(tLocal). */
function render(length, voices) {
  const n = Math.round(length * RATE);
  const out = new Float32Array(n);
  for (const v of voices) {
    const s0 = Math.round(v.at * RATE);
    const len = Math.min(n - s0, Math.round(v.len * RATE));
    for (let i = 0; i < len; i++) out[s0 + i] += v.fn(i / RATE);
  }
  // 4 ms fade-out so nothing clicks at the end.
  const tail = Math.round(0.004 * RATE);
  for (let i = 0; i < tail; i++) out[n - 1 - i] *= i / tail;
  return out;
}

const SOUNDS = {
  tap: () =>
    render(0.05, [{ at: 0, len: 0.05, fn: (t) => 0.5 * sine(1500, t) * env(t, 0.002, 0.012) }]),
  tick: () =>
    render(0.03, [{ at: 0, len: 0.03, fn: (t) => 0.35 * tri(2200, t) * env(t, 0.001, 0.006) }]),
  good: () =>
    render(0.26, [
      { at: 0, len: 0.12, fn: (t) => 0.4 * sine(784, t) * env(t, 0.004, 0.05) },
      { at: 0.08, len: 0.18, fn: (t) => 0.42 * sine(1175, t) * env(t, 0.004, 0.07) },
    ]),
  bad: () =>
    render(0.24, [
      {
        at: 0,
        len: 0.24,
        // Falling 260 → 170 Hz, triangle for a soft buzz.
        fn: (t) => 0.42 * tri(260 - 375 * t, t) * env(t, 0.006, 0.09),
      },
    ]),
  go: () =>
    render(0.32, [
      {
        at: 0,
        len: 0.32,
        fn: (t) => 0.45 * (sine(880, t) + 0.25 * sine(1760, t)) * env(t, 0.005, 0.11),
      },
    ]),
  beep: () =>
    render(0.14, [{ at: 0, len: 0.14, fn: (t) => 0.38 * sine(1000, t) * env(t, 0.004, 0.08) }]),
  chime: () =>
    render(1.6, [
      {
        at: 0,
        len: 1.6,
        // Bell partials (inharmonic), each with its own decay.
        fn: (t) =>
          0.32 * sine(528, t) * env(t, 0.006, 0.6) +
          0.16 * sine(528 * 2.76, t) * env(t, 0.004, 0.25) +
          0.08 * sine(528 * 5.4, t) * env(t, 0.003, 0.1),
      },
    ]),
  'tone-low': () => tone(330),
  'tone-mid': () => tone(440),
  'tone-high': () => tone(587),
};

function tone(f) {
  return render(0.34, [
    {
      at: 0,
      len: 0.34,
      fn: (t) => 0.4 * (sine(f, t) + 0.15 * sine(2 * f, t)) * env(t, 0.008, 0.16),
    },
  ]);
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

mkdirSync(OUT, { recursive: true });
for (const [id, make] of Object.entries(SOUNDS)) {
  const buf = wav(make());
  writeFileSync(join(OUT, `${id}.wav`), buf);
  console.log(`${id}.wav ${buf.length} bytes`);
}
