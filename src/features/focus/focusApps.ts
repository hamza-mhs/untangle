import { appCount, type AppSelection, type Rule } from '@/features/rules/model';

/**
 * What a focus session locks: the user's focus selection if they edited it, otherwise every app
 * in their rules. Android package lists merge; iOS selections are opaque tokens that can't be
 * merged in JS, so the largest one is used until the user picks a focus selection.
 */
export function focusSelection(
  rules: readonly Rule[],
  own: AppSelection | null,
): AppSelection | null {
  if (own) return own;
  const android = rules.flatMap((r) => (r.apps.platform === 'android' ? r.apps.packages : []));
  if (android.length) return { platform: 'android', packages: [...new Set(android)] };
  const ios = rules
    .map((r) => r.apps)
    .filter((a): a is Extract<AppSelection, { platform: 'ios' }> => a.platform === 'ios')
    .sort((a, b) => b.count - a.count)[0];
  return ios ?? null;
}

export function focusAppCount(selection: AppSelection | null): number {
  return selection ? appCount(selection) : 0;
}
