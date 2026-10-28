import { useChallengesStore } from '@/features/challenges/store';
import { useRulesStore } from '@/features/rules/store';
import { useScoringStore } from '@/features/scoring/store';
import { useTrialStore } from '@/features/paywall/trialStore';
import { kv, STORE_KEYS } from '@/storage/kv';

const NOW = new Date(2026, 9, 22, 9).getTime();

describe('stores (MMKV-persisted)', () => {
  test('completing a drawn challenge credits points once and persists', () => {
    const draw = useChallengesStore.getState().ensureToday(NOW);
    const id = draw.cards[0];
    expect(useChallengesStore.getState().complete(id, NOW)).toBeGreaterThan(0);
    expect(useChallengesStore.getState().complete(id, NOW)).toBeNull();
    const s = useScoringStore.getState();
    expect(s.points).toBeGreaterThan(0);
    expect(s.streak(NOW)).toBe(1);
    expect(JSON.parse(kv.getString(STORE_KEYS.scoring)!).state.points).toBe(s.points);
  });

  test('switching on the first rule starts the reverse trial', () => {
    expect(useTrialStore.getState().startedAt).toBeNull();
    useRulesStore.getState().upsertRule({
      id: 'r1',
      name: 'Evenings',
      strength: 'pause',
      schedule: { days: [1, 2, 3, 4, 5], start: '18:00', end: '22:00' },
      apps: { platform: 'android', packages: ['com.example.feed'] },
      enabled: false,
      createdAt: NOW,
    });
    expect(useTrialStore.getState().startedAt).toBeNull();
    useRulesStore.getState().setEnabled('r1', true);
    const started = useTrialStore.getState().startedAt;
    expect(started).not.toBeNull();
    useRulesStore.getState().setEnabled('r1', false);
    useRulesStore.getState().setEnabled('r1', true);
    expect(useTrialStore.getState().startedAt).toBe(started);
  });
});
