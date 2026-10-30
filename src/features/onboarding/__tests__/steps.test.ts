import {
  CHAPTERS,
  chapterOf,
  chaptersDone,
  hasBack,
  hrefFor,
  nextStep,
  ONBOARDING_STEPS,
  resumeStep,
} from '../steps';
import { useOnboardingStore } from '../onboardingStore';

describe('onboarding steps', () => {
  test('19 routes, welcome first and all-set last', () => {
    expect(ONBOARDING_STEPS).toHaveLength(19);
    expect(ONBOARDING_STEPS[0]).toBe('index');
    expect(nextStep('all-set')).toBeNull();
    expect(nextStep('focus-signs')).toBe('studying');
  });

  test('every step after the welcome belongs to a chapter, in order', () => {
    expect(chapterOf('index')).toBeNull();
    let last = 0;
    for (const s of ONBOARDING_STEPS.slice(1)) {
      const done = chaptersDone(s);
      expect(done).toBeGreaterThanOrEqual(last);
      expect(done).toBeLessThanOrEqual(CHAPTERS.length);
      last = done;
    }
    expect(chaptersDone('age')).toBe(1);
    expect(chaptersDone('trial')).toBe(4);
    expect(chaptersDone('all-set')).toBe(5);
  });

  test('no back chevron on welcome or studying', () => {
    expect(hasBack('index')).toBe(false);
    expect(hasBack('studying')).toBe(false);
    expect(hasBack('age')).toBe(true);
  });

  test('resume reopens the saved screen; the disclosure reopens on permissions', () => {
    expect(resumeStep('hours-back')).toBe('hours-back');
    expect(resumeStep('accessibility')).toBe('permissions');
    expect(hrefFor('index')).toBe('/');
    expect(hrefFor('pick-apps')).toBe('/pick-apps');
  });
});

describe('onboarding store', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  test('answers, step and completion persist in the store', () => {
    const s = useOnboardingStore.getState();
    s.setAnswer('ageMid', 29);
    s.setStep('scroll-time');
    expect(useOnboardingStore.getState().answers.ageMid).toBe(29);
    expect(useOnboardingStore.getState().step).toBe('scroll-time');
    useOnboardingStore.getState().complete(123);
    expect(useOnboardingStore.getState().completedAt).toBe(123);
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().completedAt).toBeNull();
  });
});
