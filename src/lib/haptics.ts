import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/features/settings/store';

/**
 * The only place that may import expo-haptics (enforced by ESLint). Every call respects the
 * user's Haptics setting and never throws — haptics are decoration, not behaviour.
 */

const enabled = () => useSettingsStore.getState().hapticsEnabled;

function run(fn: () => Promise<void>) {
  if (!enabled()) return;
  fn().catch(() => {});
}

export const haptics = {
  /** Light tap: buttons, toggles. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Selection change: chips, pickers, card flips. */
  select: () => run(() => Haptics.selectionAsync()),
  /** Challenge done, session complete. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Blocked action, last emergency pass. */
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /** Wrong answer in a rep, failed action. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
