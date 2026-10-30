import { useSettingsStore } from '@/features/settings/store';

import { playSound } from '../sound';

const mockPlay = jest.fn();
const mockSeekTo = jest.fn(() => Promise.resolve());
const mockSetAudioMode = jest.fn((_m: unknown) => Promise.resolve());

jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({ play: mockPlay, pause: jest.fn(), seekTo: mockSeekTo }),
  setAudioModeAsync: (m: unknown) => mockSetAudioMode(m),
}));

beforeEach(() => {
  mockPlay.mockClear();
  mockSeekTo.mockClear();
});

describe('sound', () => {
  it('mutes in silent / vibrate mode via the audio mode', () => {
    useSettingsStore.getState().setSoundEnabled(true);
    playSound('tap');
    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }),
    );
    expect(mockSeekTo).toHaveBeenCalledWith(0);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it('respects Settings › Sound', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    playSound('good');
    expect(mockPlay).not.toHaveBeenCalled();
    useSettingsStore.getState().setSoundEnabled(true);
  });
});
