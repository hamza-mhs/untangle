import {
  parsePauseParams,
  pickPauseGame,
  planPause,
  reasonChip,
  type PauseParams,
} from '../variant';

const S = { unlockMinutesGentle: 5, unlockMinutesFirm: 3, firmWaitSeconds: 30 };
const p = (over: Partial<PauseParams> = {}) => ({
  reason: 'time' as const,
  strictness: 'gentle' as const,
  unlocksUsed: 0,
  minutesAllowed: 30,
  preview: false,
  ...over,
});

describe('planPause', () => {
  it('gentle unlocks for the Settings length', () => {
    expect(planPause(p(), S)).toMatchObject({
      variant: 'gentle',
      unlockMinutes: 5,
      waitSeconds: 0,
    });
  });
  it('firm waits 30 s for a 3-minute unlock', () => {
    expect(planPause(p({ strictness: 'firm' }), S)).toMatchObject({
      variant: 'firm',
      unlockMinutes: 3,
      waitSeconds: 30,
    });
  });
  it('locked never unlocks', () => {
    expect(planPause(p({ strictness: 'locked' }), S)).toMatchObject({
      variant: 'locked',
      unlockMinutes: null,
    });
  });
  it('caps: 3 gentle, 2 firm', () => {
    expect(planPause(p({ unlocksUsed: 2 }), S).variant).toBe('gentle');
    expect(planPause(p({ unlocksUsed: 3 }), S).variant).toBe('capReached');
    expect(planPause(p({ strictness: 'firm', unlocksUsed: 2 }), S)).toMatchObject({
      variant: 'capReached',
      unlockMinutes: null,
    });
  });
  it('time is up: no choices, nothing logged', () => {
    expect(planPause(p({ reason: 'time_up' }), S)).toMatchObject({
      variant: 'timeUp',
      offersChoices: false,
      logsDetours: false,
    });
  });
  it('focus sessions never unlock', () => {
    expect(planPause(p({ reason: 'focus', strictness: 'gentle' }), S)).toMatchObject({
      variant: 'focus',
      unlockMinutes: null,
    });
  });
  it('blocked all day keeps the strictness actions', () => {
    expect(planPause(p({ reason: 'always', minutesAllowed: 0 }), S)).toMatchObject({
      variant: 'gentle',
      allDay: true,
    });
  });
  it('preview logs nothing', () => {
    expect(planPause(p({ preview: true }), S).logsDetours).toBe(false);
  });
});

describe('reasonChip', () => {
  it('shows the allowance that tripped', () => {
    expect(reasonChip({ reason: 'time', minutesAllowed: 30, opensAllowed: 5 })).toEqual({
      key: 'minutes',
      minutes: 30,
    });
    expect(reasonChip({ reason: 'opens', minutesAllowed: 30, opensAllowed: 5 })).toEqual({
      key: 'opens',
      opens: 5,
    });
    expect(reasonChip({ reason: 'always', minutesAllowed: 0, opensAllowed: null })).toEqual({
      key: 'allDay',
    });
    expect(reasonChip({ reason: 'focus', minutesAllowed: 30, opensAllowed: null })).toEqual({
      key: 'focus',
    });
  });
});

describe('pickPauseGame', () => {
  const rand = () => 0;
  it('offers the next unplayed quick training game', () => {
    expect(
      pickPauseGame({
        training: ['colourWord', 'echo', 'breathCount'],
        playedToday: new Set(),
        recentOffered: [],
        rand,
      }),
    ).toBe('colourWord');
    expect(
      pickPauseGame({
        training: ['colourWord', 'echo', 'breathCount'],
        playedToday: new Set(['colourWord']),
        recentOffered: [],
        rand,
      }),
    ).toBe('echo');
  });
  it('skips calm training games and recent offers', () => {
    const g = pickPauseGame({
      training: ['breathCount'],
      playedToday: new Set(),
      recentOffered: ['stackTower'],
      rand,
    });
    expect(g).not.toBe('breathCount');
    expect(g).not.toBe('stackTower');
  });
});

describe('parsePauseParams', () => {
  it('reads the service deep link', () => {
    expect(
      parsePauseParams({
        targetKey: 'app:com.instagram.android',
        reason: 'opens',
        label: 'Instagram',
        strictness: 'firm',
        opensToday: '4',
        opensAllowed: '3',
        minutesAllowed: '',
      }),
    ).toMatchObject({
      reason: 'opens',
      strictness: 'firm',
      opensToday: 4,
      opensAllowed: 3,
      minutesAllowed: null,
      preview: false,
    });
  });
  it('rejects a missing or bad target', () => {
    expect(parsePauseParams({})).toBeNull();
    expect(parsePauseParams({ targetKey: 'nope' })).toBeNull();
  });
});
