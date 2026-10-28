import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildWidgetState } from '@/features/widgetSync';
import { useChallengesStore } from '@/features/challenges/store';
import { useFocusStore } from '@/features/focus/store';
import { lastWidgetStateJson, writeWidgetState } from '@/native/widgets';
import { readAloudScore } from '@/native/speech';
import { isFaceDown } from '@/services/sensors/faceDown';
import { emptyWidgetState, serializeWidgetState, WIDGET_STATE_FIELDS } from '@shared/widgetState';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('shared widget state contract', () => {
  const swift = read('targets/_shared/WidgetState.swift');
  const kotlin = read(
    'modules/blocker-android/android/src/main/java/com/todo/untangle/blocker/SharedState.kt',
  );

  const declares = (src: string, keyword: 'var' | 'val', field: string) =>
    new RegExp(String.raw`\b${keyword} ${field}\b`).test(src);

  test.each(WIDGET_STATE_FIELDS)('Swift and Kotlin mirrors declare "%s"', (field) => {
    expect(declares(swift, 'var', field)).toBe(true);
    expect(declares(kotlin, 'val', field)).toBe(true);
  });

  test('nested fields are mirrored too', () => {
    for (const f of ['id', 'title', 'done', 'active', 'endsAt', 'lockedCount']) {
      expect(declares(swift, 'var', f)).toBe(true);
      expect(declares(kotlin, 'val', f)).toBe(true);
    }
  });

  test('Live Activity attributes are identical in the module and the widget target', () => {
    const body = (src: string) => src.slice(src.indexOf('struct FocusActivityAttributes'));
    const moduleCopy = body(read('modules/blocker-ios/ios/LiveActivity.swift'));
    const targetCopy = body(read('targets/_shared/FocusActivityAttributes.swift'));
    expect(moduleCopy.startsWith(targetCopy.trim())).toBe(true);
  });

  test('serialization clamps ranges and caps challenges', () => {
    const s = JSON.parse(
      serializeWidgetState({
        ...emptyWidgetState(0),
        tangleProgress: 4,
        clarity: 140.6,
        streak: -2,
        challenges: Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, title: 't', done: false })),
      }),
    );
    expect(s).toMatchObject({ tangleProgress: 1, clarity: 100, streak: 0 });
    expect(s.challenges).toHaveLength(3);
    expect(Object.keys(s).sort()).toEqual([...WIDGET_STATE_FIELDS].sort());
  });

  test('state is built from the stores', async () => {
    const now = new Date(2026, 9, 22, 10).getTime();
    const draw = useChallengesStore.getState().ensureToday(now);
    useChallengesStore.getState().complete(draw.cards[0], now);
    useFocusStore.getState().dispatch({ type: 'start', now, minutes: 25, lockedCount: 7 });
    const state = buildWidgetState(now + 1000);
    expect(state.challenges).toHaveLength(3);
    expect(state.tangleProgress).toBeCloseTo(1 / 3);
    expect(state.focus).toEqual({ active: true, endsAt: now + 25 * 60_000, lockedCount: 7 });
    await writeWidgetState(state);
    expect(JSON.parse(lastWidgetStateJson()!).focus.lockedCount).toBe(7);
  });
});

describe('native helpers (pure parts)', () => {
  test('read-aloud score', () => {
    expect(readAloudScore('The quick brown fox.', 'the quick brown fox')).toBe(1);
    expect(readAloudScore('one two three four', 'one three')).toBe(0.5);
    expect(readAloudScore('', 'anything')).toBe(0);
  });

  test('face-down threshold', () => {
    expect(isFaceDown(9.7)).toBe(true);
    expect(isFaceDown(-9.7)).toBe(false);
  });
});
