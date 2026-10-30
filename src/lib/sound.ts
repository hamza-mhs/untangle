import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import bad from '@/assets/sounds/bad.wav';
import beep from '@/assets/sounds/beep.wav';
import chime from '@/assets/sounds/chime.wav';
import go from '@/assets/sounds/go.wav';
import good from '@/assets/sounds/good.wav';
import tap from '@/assets/sounds/tap.wav';
import tick from '@/assets/sounds/tick.wav';
import toneHigh from '@/assets/sounds/tone-high.wav';
import toneLow from '@/assets/sounds/tone-low.wav';
import toneMid from '@/assets/sounds/tone-mid.wav';
import { useSettingsStore } from '@/features/settings/store';

/**
 * The only place that may import expo-audio (enforced by ESLint). Sounds respect Settings › Sound
 * and the phone's silent / vibrate mode (`playsInSilentMode: false` — expo-audio suppresses
 * playback on Android then). Never throws: sounds are decoration, not behaviour.
 * The files are synthesized by tools/sounds/generate.mjs.
 */

const SOURCES = {
  tap,
  tick,
  good,
  bad,
  go,
  beep,
  chime,
  'tone-low': toneLow,
  'tone-mid': toneMid,
  'tone-high': toneHigh,
} as const;

export type SoundId = keyof typeof SOURCES;

const players = new Map<SoundId, AudioPlayer>();
let ready = false;

/** Sets the audio mode and creates one player per sound. Safe to call more than once. */
export function preloadSounds() {
  if (ready) return;
  ready = true;
  setAudioModeAsync({
    playsInSilentMode: false,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  }).catch(() => {});
  for (const id of Object.keys(SOURCES) as SoundId[]) {
    try {
      players.set(id, createAudioPlayer(SOURCES[id]));
    } catch {
      // No sound for this id.
    }
  }
}

export function playSound(id: SoundId) {
  if (!useSettingsStore.getState().soundEnabled) return;
  preloadSounds();
  const p = players.get(id);
  if (!p) return;
  try {
    // Restart from the top so quick repeats still sound. Pause first: a finished player keeps
    // playWhenReady, so a bare seek would restart it natively and skip the silent-mode check in play().
    p.pause();
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // Ignore.
  }
}
