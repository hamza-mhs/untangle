import { GameClock, isAborted, timerState } from '../clock';

describe('GameClock', () => {
  it('counts only while running', () => {
    let t = 0;
    const c = new GameClock(() => t);
    expect(c.now()).toBe(0);
    c.start();
    t = 1000;
    expect(c.now()).toBe(1000);
    c.pause();
    t = 5000;
    expect(c.now()).toBe(1000);
    c.start();
    t = 5500;
    expect(c.now()).toBe(1500);
  });

  it('waits in game time and freezes while paused', async () => {
    let t = 0;
    const c = new GameClock(() => t);
    c.start();
    let done = false;
    void c.wait(500).then(() => (done = true));
    t = 300;
    c.pause();
    t = 10_000;
    c.tick();
    await Promise.resolve();
    expect(done).toBe(false);
    c.start();
    t = 10_200;
    c.tick();
    await Promise.resolve();
    expect(done).toBe(true);
  });

  it('dispose rejects pending waits', async () => {
    const c = new GameClock(() => 0);
    c.start();
    const p = c.wait(100);
    c.dispose();
    await p.catch((e) => expect(isAborted(e)).toBe(true));
  });
});

describe('timerState', () => {
  it('normal → warning at 40% → last 5 s → up', () => {
    expect(timerState(30_000, 40_000)).toBe('normal');
    expect(timerState(16_000, 40_000)).toBe('warning');
    expect(timerState(5_000, 40_000)).toBe('last');
    expect(timerState(0, 40_000)).toBe('up');
  });
});
