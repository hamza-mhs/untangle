import { StyleSheet } from 'react-native';

import type { TextTone } from '@/design/components';
import { color } from '@/design/tokens';

import type { GameColor } from './catalog';

/** One colour per game (pack 2 SPEC §1), as backgrounds and as text tones. */
export const gameBg = StyleSheet.create({
  number: { backgroundColor: color.game.number },
  word: { backgroundColor: color.game.word },
  memory: { backgroundColor: color.game.memory },
  read: { backgroundColor: color.read },
});

export const gameBorder = StyleSheet.create({
  number: { borderColor: color.game.number },
  word: { borderColor: color.game.word },
  memory: { borderColor: color.game.memory },
  read: { borderColor: color.read },
});

export const GAME_TONE: Record<GameColor, TextTone> = {
  number: 'accent',
  word: 'word',
  memory: 'memory',
  read: 'read',
};

export const GAME_HEX: Record<GameColor, string> = {
  number: color.game.number,
  word: color.game.word,
  memory: color.game.memory,
  read: color.read,
};
