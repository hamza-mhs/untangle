import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ErrorBoundary } from '@/design/components';
import { RuleEditor } from '@/features/rules/components/RuleEditor';
import { useRuleDraftStore } from '@/features/rules/draftStore';
import { lockedUntil } from '@/features/rules/rules';
import { useRulesStore } from '@/features/rules/store';

/**
 * FRuleEdit · edit. Editing an active Locked rule is blocked: show "locked until" instead
 * (EDGE_CASES › Blocking and focus).
 */
export default function EditRule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rule = useRulesStore((s) => s.rules.find((r) => r.id === id) ?? null);
  const [until] = useState(() => (rule ? lockedUntil(rule, new Date()) : null));
  useState(() => {
    if (rule && !until)
      useRuleDraftStore.getState().begin(rule, { name: rule.name, strength: rule.strength });
    return true;
  });
  if (!rule) return <Redirect href="/block" />;
  if (until) return <Redirect href={{ pathname: '/rule/locked', params: { until } }} />;
  return (
    <ErrorBoundary name="rule.edit">
      <RuleEditor />
    </ErrorBoundary>
  );
}
