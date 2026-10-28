import { Platform } from 'react-native';

import { useMocks } from './env';

/**
 * Read-aloud speech (pack 2 SPEC §4) via expo-speech-recognition. On-device only, so audio
 * never leaves the phone: Android `createOnDeviceSpeechRecognizer` (API 31+), iOS
 * `requiresOnDeviceRecognition`. If the device can't listen offline in the language we say so
 * (E: speech unavailable) and offer "Read silently instead". We never fall back to server
 * recognition. TODO(verify): language availability on real devices, both platforms.
 */

export type SpeechAvailability = 'ok' | 'denied' | 'unavailable';

export type ListenHandlers = {
  /** The recogniser's current transcript for this segment (interim results are cumulative). */
  onResult: (transcript: string, isFinal: boolean) => void;
  /** Input level 0–1 for the ListeningBar bars. */
  onVolume?: (level: number) => void;
  /** The recogniser stopped by itself (silence, segment end). Callers restart while listening. */
  onEnd?: () => void;
  onError?: (code: string) => void;
};

export type Listening = { stop: () => void };

const VOLUME_MIN = -2;
const VOLUME_MAX = 10;
const MOCK_WORD_MS = 380;

/** Checks offline support for `lang`, then asks for the mic (asked on "Start reading" only). */
export async function prepareSpeech(lang: string): Promise<SpeechAvailability> {
  if (useMocks) return 'ok';
  try {
    const { ExpoSpeechRecognitionModule: Speech } = await import('expo-speech-recognition');
    if (!Speech.supportsOnDeviceRecognition()) return 'unavailable';
    if (Platform.OS === 'android') {
      const { installedLocales } = await Speech.getSupportedLocales({});
      const base = lang.split('-')[0]!.toLowerCase();
      const installed = installedLocales.some(
        (l) => l.toLowerCase().replace('_', '-').split('-')[0] === base,
      );
      if (installedLocales.length > 0 && !installed) return 'unavailable';
    }
    const perm = await Speech.requestPermissionsAsync();
    return perm.granted ? 'ok' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * Starts one recogniser session. `mockText` lets dev builds without a recogniser "hear" the page
 * word by word, so the reading flow can be walked through on an emulator.
 */
export async function listen(
  lang: string,
  handlers: ListenHandlers,
  mockText?: string,
): Promise<Listening> {
  if (useMocks) {
    const words = (mockText ?? '').split(/\s+/).filter(Boolean);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      handlers.onVolume?.(Math.random());
      handlers.onResult(words.slice(0, i).join(' '), i >= words.length);
      if (i >= words.length) clearInterval(id);
    }, MOCK_WORD_MS);
    return { stop: () => clearInterval(id) };
  }
  const { ExpoSpeechRecognitionModule: Speech } = await import('expo-speech-recognition');
  const subs = [
    Speech.addListener('result', (e) =>
      handlers.onResult(e.results[0]?.transcript ?? '', e.isFinal),
    ),
    Speech.addListener('volumechange', (e) =>
      handlers.onVolume?.(
        Math.min(1, Math.max(0, (e.value - VOLUME_MIN) / (VOLUME_MAX - VOLUME_MIN))),
      ),
    ),
    Speech.addListener('end', () => handlers.onEnd?.()),
    Speech.addListener('error', (e) => handlers.onError?.(e.error)),
  ];
  Speech.start({
    lang,
    interimResults: true,
    continuous: true,
    requiresOnDeviceRecognition: true,
    addsPunctuation: false,
    volumeChangeEventOptions: { enabled: true, intervalMillis: 120 },
  });
  return {
    stop: () => {
      subs.forEach((s) => s.remove());
      Speech.abort();
    },
  };
}

/** Word-level match score (0–1) between the passage and what was heard. */
export function readAloudScore(passage: string, heard: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s']/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const target = norm(passage);
  const got = new Set(norm(heard));
  if (target.length === 0) return 0;
  return target.filter((w) => got.has(w)).length / target.length;
}
