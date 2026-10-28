import { useState } from 'react';

import { ErrorBoundary } from '@/design/components';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { RuleEditor } from '@/features/rules/components/RuleEditor';
import { useRuleDraftStore } from '@/features/rules/draftStore';
import { useRulesStore } from '@/features/rules/store';
import { t } from '@/i18n';

/** FRuleEdit · new rule. Defaults: weekdays 09:00–17:00, the OB08 strength. */
export default function NewRule() {
  useState(() => {
    useRuleDraftStore.getState().begin(null, {
      name: t('rules.newName', { n: useRulesStore.getState().rules.length + 1 }),
      strength:
        useOnboardingStore.getState().strength === 'locked'
          ? 'earn'
          : useOnboardingStore.getState().strength,
    });
    return true;
  });
  return (
    <ErrorBoundary name="rule.new">
      <RuleEditor />
    </ErrorBoundary>
  );
}
