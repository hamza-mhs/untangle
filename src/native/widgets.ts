import { Platform } from 'react-native';

import { serializeWidgetState, type WidgetState } from '@shared/widgetState';

import { optionalModule, useMocks } from './env';

/**
 * Writes the shared widget state (shared/widgetState.ts) to the App Group / SharedPreferences
 * and asks widgets to refresh. Widgets, the Live Activity and shield screens read only this.
 */
type SharedStateModule = { writeSharedState(json: string): void | Promise<void> };

const mod = useMocks
  ? null
  : optionalModule<SharedStateModule>(Platform.OS === 'ios' ? 'BlockerIos' : 'BlockerAndroid');

let lastWritten: string | null = null;

export async function writeWidgetState(state: WidgetState): Promise<void> {
  const json = serializeWidgetState(state);
  if (json === lastWritten) return; // avoid needless widget reloads (iOS budgets them)
  lastWritten = json;
  await mod?.writeSharedState(json);
}

/** For tests / dev tools: what was last sent to native. */
export function lastWidgetStateJson(): string | null {
  return lastWritten;
}
