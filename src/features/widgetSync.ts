import { dayKey } from '@/lib/time';
import { writeWidgetState } from '@/native/widgets';
import { WIDGET_STATE_VERSION, type WidgetState } from '@shared/widgetState';

import { useChallengesStore } from './challenges/store';
import { challengeById } from './challenges/library';
import { useFocusStore } from './focus/store';
import { activeRules } from './rules/rules';
import { useRulesStore } from './rules/store';
import { useScoringStore } from './scoring/store';

/** Builds the shared widget state from the stores. Pure apart from reading them. */
export function buildWidgetState(now = Date.now()): WidgetState {
  const draw = useChallengesStore.getState().draw;
  const today = draw?.day === dayKey(now) ? draw : null;
  const challenges = (today?.cards ?? []).map((id) => ({
    id,
    title: challengeById(id)?.title ?? id,
    done: today?.done.includes(id) ?? false,
  }));
  const session = useFocusStore.getState().session;
  const scoring = useScoringStore.getState();
  const rules = useRulesStore.getState().rules;
  return {
    version: WIDGET_STATE_VERSION,
    tangleProgress: challenges.filter((c) => c.done).length / 3,
    clarity: scoring.clarity(now),
    streak: scoring.streak(now),
    challenges,
    focus:
      session.status === 'running'
        ? { active: true, endsAt: session.endsAt, lockedCount: session.lockedCount }
        : { active: false, endsAt: null, lockedCount: 0 },
    rulesActive: activeRules(rules, new Date(now)).length,
    // TODO: false when blocker.getAuthorization() !== 'approved' or the Android service died.
    blockingHealthy: true,
    updatedAt: now,
  };
}

/** Keep widgets in sync: write on every relevant store change. Returns an unsubscribe. */
export function startWidgetSync(): () => void {
  const push = () => void writeWidgetState(buildWidgetState());
  push();
  const unsubs = [useChallengesStore, useFocusStore, useScoringStore, useRulesStore].map((s) =>
    (s.subscribe as (fn: () => void) => () => void)(push),
  );
  return () => unsubs.forEach((u) => u());
}
