import type { InstalledApp } from '@/native';

/**
 * The usual suspects (10-phase1-onboarding §2.18): apps Pick apps offers first, in this order
 * when there is no usage data. Package names from Google Play.
 */
export const SUSPECTS: readonly string[] = [
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.ss.android.ugc.trill', // TikTok (some regions)
  'com.google.android.youtube',
  'com.twitter.android', // X
  'com.reddit.frontpage',
  'com.snapchat.android',
  'com.facebook.katana',
  'com.instagram.barcelona', // Threads
  'com.pinterest',
  'com.netflix.mediaclient',
  'tv.twitch.android.app',
  'com.discord',
  'com.tumblr',
  'com.ninegag.android.app',
  'com.facebook.lite',
  'com.linkedin.android',
  'com.bereal.ft',
];

/** How many suspects Pick apps switches on by default. */
export const PRESELECTED = 3;

/**
 * Installed suspects, sorted by minutes used (most first) when usage is known, else in the
 * list's order. Ties keep the list's order.
 */
export function rankSuspects(
  installed: readonly InstalledApp[],
  minutesByPackage: Readonly<Record<string, number>> | null,
): InstalledApp[] {
  const order = (p: string) => SUSPECTS.indexOf(p);
  const found = installed.filter((a) => order(a.packageName) >= 0);
  return found.sort((a, b) => {
    if (minutesByPackage) {
      const d = (minutesByPackage[b.packageName] ?? 0) - (minutesByPackage[a.packageName] ?? 0);
      if (d !== 0) return d;
    }
    return order(a.packageName) - order(b.packageName);
  });
}
