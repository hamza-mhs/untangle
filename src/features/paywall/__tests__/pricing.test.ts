import { ctaKind, formatMoney, savePercent, weeklyAmount, weeklyString } from '../pricing';

describe('savePercent', () => {
  it('compares yearly with twelve months of monthly', () => {
    expect(savePercent(29.99, 6.99)).toBe(64);
    expect(savePercent(29.99, 4.99)).toBe(50);
  });
  it('never goes negative and survives a zero monthly price', () => {
    expect(savePercent(100, 5)).toBe(0);
    expect(savePercent(10, 0)).toBe(0);
  });
});

describe('weekly price', () => {
  it('divides a year into 52 weeks', () => {
    expect(weeklyAmount({ id: 'yearly', price: 29.99 })).toBeCloseTo(0.5767, 3);
    expect(weeklyAmount({ id: 'monthly', price: 6.99 })).toBeCloseTo(1.613, 3);
  });
  it('formats in the store currency', () => {
    expect(weeklyString({ id: 'yearly', price: 29.99, currencyCode: 'USD' }, 'en-US')).toBe(
      '$0.58',
    );
    expect(weeklyString({ id: 'monthly', price: 6.99, currencyCode: 'USD' }, 'en-US')).toBe(
      '$1.61',
    );
    expect(formatMoney(1.5, 'EUR', 'de-DE')).toMatch(/1,50\s?€/);
  });
  it('falls back without a valid currency', () => {
    expect(formatMoney(1.5, 'NOPE!')).toBe('NOPE! 1.50');
  });
});

describe('ctaKind', () => {
  it('says trial only when the offer has one', () => {
    expect(ctaKind({ hasTrial: true })).toBe('trial');
    expect(ctaKind({ hasTrial: false })).toBe('subscribe');
  });
});
