import type { BlockingRule } from './BlockingService';

/** Rule payload shared by modules/blocker-ios and modules/blocker-android (`applyRules`). */
export function rulesToNativeJson(rules: readonly BlockingRule[]): string {
  return JSON.stringify(
    rules.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      strength: r.strength,
      start: r.start,
      end: r.end,
      days: r.days,
      token: r.selection.platform === 'ios' ? r.selection.token : null,
      packages: r.selection.platform === 'android' ? r.selection.packages : [],
    })),
  );
}
