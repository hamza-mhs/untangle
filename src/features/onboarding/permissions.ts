/**
 * Permission step state machine (10-phase1-onboarding §2.16). Pure: the screen feeds it what
 * is granted and what the user has tried, it says what the CTA does and what rows show.
 */

export const PERMISSIONS = ['accessibility', 'usage', 'battery'] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type Granted = Record<Permission, boolean>;

export type PermissionProgress = {
  /** Returns from Accessibility (or "Not now") without it switched on. */
  accessibilityFailures: number;
  /** "Skip for now" was used: carry on without Accessibility. */
  accessibilitySkipped: boolean;
  /** Usage access / battery were asked once; denying them is allowed. */
  asked: Record<Exclude<Permission, 'accessibility'>, boolean>;
};

export const INITIAL_PROGRESS: PermissionProgress = {
  accessibilityFailures: 0,
  accessibilitySkipped: false,
  asked: { usage: false, battery: false },
};

/** After this many failed returns: "Skip for now" and the restricted-settings help. */
export const FAILURES_FOR_HELP = 2;

export type CtaLabel = 'allow' | 'allowRest' | 'tryAgain' | 'continue';

/** The next permission the walk asks for, or null when the user can move on. */
export function nextPermission(granted: Granted, p: PermissionProgress): Permission | null {
  if (!granted.accessibility && !p.accessibilitySkipped) {
    // After a failure the walk stops on Accessibility until the user taps Try again.
    return 'accessibility';
  }
  if (!granted.usage && !p.asked.usage) return 'usage';
  if (!granted.battery && !p.asked.battery) return 'battery';
  return null;
}

export function ctaLabel(granted: Granted, p: PermissionProgress): CtaLabel {
  const next = nextPermission(granted, p);
  if (next === null) return 'continue';
  if (next === 'accessibility' && p.accessibilityFailures > 0) return 'tryAgain';
  return PERMISSIONS.some((k) => granted[k]) ? 'allowRest' : 'allow';
}

export function showSkip(granted: Granted, p: PermissionProgress): boolean {
  return (
    !granted.accessibility &&
    !p.accessibilitySkipped &&
    p.accessibilityFailures >= FAILURES_FOR_HELP
  );
}

/** The "Can't turn it on?" sheet opens once, on the return that reaches the threshold. */
export function shouldOfferRestrictedHelp(
  before: PermissionProgress,
  after: PermissionProgress,
): boolean {
  return (
    before.accessibilityFailures < FAILURES_FOR_HELP &&
    after.accessibilityFailures >= FAILURES_FOR_HELP
  );
}

export type RowStatus = 'granted' | 'notOnYet' | 'pending';

export function rowStatus(k: Permission, granted: Granted, p: PermissionProgress): RowStatus {
  if (granted[k]) return 'granted';
  if (k === 'accessibility' && p.accessibilityFailures > 0) return 'notOnYet';
  return 'pending';
}

/** Record the result of one trip to a settings screen. */
export function afterReturn(
  k: Permission,
  grantedNow: boolean,
  p: PermissionProgress,
): PermissionProgress {
  if (k === 'accessibility') {
    return grantedNow ? p : { ...p, accessibilityFailures: p.accessibilityFailures + 1 };
  }
  return { ...p, asked: { ...p.asked, [k]: true } };
}
