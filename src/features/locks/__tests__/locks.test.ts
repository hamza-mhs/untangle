import { mockBlocker, resetMockBlocker } from '@/native/untangleBlocker.mock';

import { normalizeDomain } from '../domain';
import { newId, useLocksStore } from '../locksStore';
import { rankSuspects } from '../suspects';

describe('normalizeDomain', () => {
  it.each([
    ['reddit.com', 'reddit.com'],
    ['  Reddit.COM ', 'reddit.com'],
    ['https://www.reddit.com/r/all?x=1', 'reddit.com'],
    ['old.reddit.com', 'reddit.com'],
    ['http://news.ycombinator.com:443/item', 'ycombinator.com'],
    ['bbc.co.uk/news', 'bbc.co.uk'],
    ['www.amazon.co.uk', 'amazon.co.uk'],
    ['x.com', 'x.com'],
    ['9gag.com', '9gag.com'],
  ])('%s → %s', (input, out) => {
    expect(normalizeDomain(input)).toBe(out);
  });

  it.each(['', 'reddit', 'hello world', 'reddit.c', 'co.uk', '-bad.com', 'a..com', 'reddit.123'])(
    'rejects %p',
    (input) => {
      expect(normalizeDomain(input)).toBeNull();
    },
  );
});

describe('newId', () => {
  it('makes v4 uuids', () => {
    expect(newId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(newId()).not.toBe(newId());
  });
});

describe('rankSuspects', () => {
  const app = (packageName: string, label: string) => ({ packageName, label, category: null });
  const installed = [
    app('com.whatsapp', 'WhatsApp'),
    app('com.reddit.frontpage', 'Reddit'),
    app('com.instagram.android', 'Instagram'),
    app('com.google.android.youtube', 'YouTube'),
  ];
  it('keeps only suspects, in list order without usage', () => {
    expect(rankSuspects(installed, null).map((a) => a.label)).toEqual([
      'Instagram',
      'YouTube',
      'Reddit',
    ]);
  });
  it('sorts by minutes when usage is known', () => {
    const mins = { 'com.reddit.frontpage': 50, 'com.google.android.youtube': 10 };
    expect(rankSuspects(installed, mins).map((a) => a.label)).toEqual([
      'Reddit',
      'YouTube',
      'Instagram',
    ]);
  });
});

describe('useLocksStore', () => {
  beforeEach(() => {
    resetMockBlocker();
    useLocksStore.setState({ locks: [] });
  });

  it('creates one lock per target and writes them to the native side', async () => {
    const added = useLocksStore.getState().addLocks(
      [
        { kind: 'app', packageName: 'com.instagram.android', label: 'Instagram' },
        { kind: 'site', domain: 'reddit.com' },
      ],
      { dailyMinutes: 30, dailyOpens: null },
      'gentle',
    );
    expect(added).toHaveLength(2);
    expect(added[0]).toMatchObject({
      dailyMinutes: 30,
      dailyOpens: null,
      strictness: 'gentle',
      enabled: true,
    });
    await Promise.resolve();
    expect(await mockBlocker.getLocks()).toHaveLength(2);
  });

  it('skips targets that already have a lock', () => {
    const t = { kind: 'site', domain: 'reddit.com' } as const;
    useLocksStore.getState().addLocks([t], { dailyMinutes: 30, dailyOpens: null }, 'gentle');
    expect(
      useLocksStore.getState().addLocks([t], { dailyMinutes: 0, dailyOpens: null }, 'firm'),
    ).toEqual([]);
    expect(useLocksStore.getState().locks).toHaveLength(1);
  });

  it('updates and removes', async () => {
    const [l] = useLocksStore
      .getState()
      .addLocks(
        [{ kind: 'site', domain: 'x.com' }],
        { dailyMinutes: 30, dailyOpens: null },
        'gentle',
      );
    useLocksStore.getState().updateLock(l!.id, { enabled: false });
    expect(useLocksStore.getState().locks[0]?.enabled).toBe(false);
    useLocksStore.getState().removeLock(l!.id);
    expect(useLocksStore.getState().locks).toEqual([]);
    await Promise.resolve();
    expect(await mockBlocker.getLocks()).toEqual([]);
  });
});
