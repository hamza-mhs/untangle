import type { IconName } from '@/design/components';
import type { MoodColor } from '@/design/tokens';

/** FFocusRun "Use the time": three offline things to do instead, with their points. */
export type FocusSuggestion = {
  id: 'silence' | 'reading' | 'outside';
  icon: IconName;
  tone: MoodColor;
  points: number;
};

export const FOCUS_SUGGESTIONS: readonly FocusSuggestion[] = [
  { id: 'silence', icon: 'silence', tone: 'pink', points: 10 },
  { id: 'reading', icon: 'reading', tone: 'orange', points: 15 },
  { id: 'outside', icon: 'outside', tone: 'green', points: 20 },
];
