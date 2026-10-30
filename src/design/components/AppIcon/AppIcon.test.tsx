import { render, screen } from '@testing-library/react-native';

import { AppIcon } from './AppIcon';
import { hashString, monogram, monogramColor } from './monogram';
import { SiteIcon } from './SiteIcon';

describe('monogram', () => {
  test.each([
    ['Instagram', 'IG'],
    ['TikTok', 'TT'],
    ['YouTube', 'YT'],
    ['X', 'X'],
    ['reddit.com', 'RE'],
    ['Netflix', 'NF'],
    ['www.youtube.com', 'YT'],
    ['Google Maps', 'GM'],
    ['', '?'],
  ])('%s → %s', async (name, expected) => {
    expect(monogram(name)).toBe(expected);
  });

  test('colour is stable per key', async () => {
    expect(monogramColor('com.instagram.android')).toBe(monogramColor('com.instagram.android'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

test('falls back to a labelled monogram without a uri', async () => {
  await render(<AppIcon label="Instagram" testID="i" />);
  expect(screen.getByTestId('i').props.accessibilityLabel).toBe('Instagram');
  expect(screen.getByText('IG', { includeHiddenElements: true })).toBeTruthy();
});

test('site icon uses the domain', async () => {
  await render(<SiteIcon domain="reddit.com" />);
  expect(screen.getByText('RE', { includeHiddenElements: true })).toBeTruthy();
});
