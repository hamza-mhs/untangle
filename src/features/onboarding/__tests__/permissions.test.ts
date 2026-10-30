import {
  afterReturn,
  ctaLabel,
  INITIAL_PROGRESS,
  nextPermission,
  PERMISSIONS,
  rowStatus,
  shouldOfferRestrictedHelp,
  showSkip,
  type Granted,
  type PermissionProgress,
} from '../permissions';

const g = (accessibility: boolean, usage: boolean, battery: boolean): Granted => ({
  accessibility,
  usage,
  battery,
});

describe('permission walk', () => {
  it('asks in order, skipping what is granted', () => {
    expect(nextPermission(g(false, false, false), INITIAL_PROGRESS)).toBe('accessibility');
    expect(nextPermission(g(true, false, false), INITIAL_PROGRESS)).toBe('usage');
    expect(nextPermission(g(true, true, false), INITIAL_PROGRESS)).toBe('battery');
    expect(nextPermission(g(true, false, true), INITIAL_PROGRESS)).toBe('usage');
    expect(nextPermission(g(true, true, true), INITIAL_PROGRESS)).toBeNull();
  });

  it('labels the CTA for every combination', () => {
    for (const a of [false, true])
      for (const u of [false, true])
        for (const b of [false, true]) {
          const label = ctaLabel(g(a, u, b), INITIAL_PROGRESS);
          if (a && u && b) expect(label).toBe('continue');
          else if (!a && !u && !b) expect(label).toBe('allow');
          else expect(label).toBe('allowRest');
        }
  });

  it('lets the user continue after usage and battery were asked once and denied', () => {
    let p: PermissionProgress = INITIAL_PROGRESS;
    p = afterReturn('usage', false, p);
    p = afterReturn('battery', false, p);
    expect(nextPermission(g(true, false, false), p)).toBeNull();
    expect(ctaLabel(g(true, false, false), p)).toBe('continue');
  });

  it('accessibility denied: Try again, Not on yet, Skip after the second attempt', () => {
    const none = g(false, false, false);
    const once = afterReturn('accessibility', false, INITIAL_PROGRESS);
    expect(ctaLabel(none, once)).toBe('tryAgain');
    expect(rowStatus('accessibility', none, once)).toBe('notOnYet');
    expect(showSkip(none, once)).toBe(false);
    const twice = afterReturn('accessibility', false, once);
    expect(showSkip(none, twice)).toBe(true);
    expect(shouldOfferRestrictedHelp(once, twice)).toBe(true);
    const thrice = afterReturn('accessibility', false, twice);
    expect(shouldOfferRestrictedHelp(twice, thrice)).toBe(false);
  });

  it('skip carries on with the other two', () => {
    const p = {
      ...afterReturn('accessibility', false, afterReturn('accessibility', false, INITIAL_PROGRESS)),
      accessibilitySkipped: true,
    };
    expect(nextPermission(g(false, false, false), p)).toBe('usage');
    expect(showSkip(g(false, false, false), p)).toBe(false);
  });

  it('granting after failures clears the warning', () => {
    const p = afterReturn('accessibility', false, INITIAL_PROGRESS);
    expect(rowStatus('accessibility', g(true, false, false), p)).toBe('granted');
    expect(showSkip(g(true, false, false), { ...p, accessibilityFailures: 3 })).toBe(false);
  });

  it('rows are pending until granted', () => {
    for (const k of PERMISSIONS)
      expect(rowStatus(k, g(false, false, false), INITIAL_PROGRESS)).toBe('pending');
  });
});
