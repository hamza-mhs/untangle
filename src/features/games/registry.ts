import type { GameId } from './catalog';
import type { GameDefinition } from './engine/types';
import { definition as biggerTotal } from './games/biggerTotal';
import { definition as blockFit } from './games/blockFit';
import { definition as breathCount } from './games/breathCount';
import { definition as cardPairs } from './games/cardPairs';
import { definition as colourWord } from './games/colourWord';
import { definition as dontTapRed } from './games/dontTapRed';
import { definition as echo } from './games/echo';
import { definition as flashCount } from './games/flashCount';
import { definition as laneDash } from './games/laneDash';
import { definition as middleArrow } from './games/middleArrow';
import { definition as numberSpan } from './games/numberSpan';
import { definition as oppositeDay } from './games/oppositeDay';
import { definition as orbitSwitch } from './games/orbitSwitch';
import { definition as patternRecall } from './games/patternRecall';
import { definition as quickMaths } from './games/quickMaths';
import { definition as rocketHop } from './games/rocketHop';
import { definition as ruleFlip } from './games/ruleFlip';
import { definition as silence } from './games/silence';
import { definition as sortTheStream } from './games/sortTheStream';
import { definition as spotTheOddOne } from './games/spotTheOddOne';
import { definition as stackTower } from './games/stackTower';
import { definition as stopOnTheBeep } from './games/stopOnTheBeep';
import { definition as swapIt } from './games/swapIt';
import { definition as timeItRight } from './games/timeItRight';
import { definition as trackTheStars } from './games/trackTheStars';
import { definition as urgeSurfing } from './games/urgeSurfing';
import { definition as flowLines } from './games/flowLines';
import { definition as slideEscape } from './games/slideEscape';
import { definition as pathPainter } from './games/pathPainter';
import { definition as oneLineArt } from './games/oneLineArt';
import { definition as laserLab } from './games/laserLab';
import { definition as mergeGarden } from './games/mergeGarden';
import { definition as miniNonogram } from './games/miniNonogram';
import { definition as bridgeBuilder } from './games/bridgeBuilder';

/**
 * Every playable game (BATCH-3.1 §B, one folder each under games/). Each definition's Round
 * is a lazy import, so a board's code only loads when that game is played.
 */
export const REGISTRY: Record<GameId, GameDefinition> = {
  stackTower,
  rocketHop,
  laneDash,
  blockFit,
  colourWord,
  middleArrow,
  dontTapRed,
  echo,
  cardPairs,
  breathCount,
  silence,
  urgeSurfing,
  swapIt,
  flashCount,
  spotTheOddOne,
  trackTheStars,
  patternRecall,
  numberSpan,
  stopOnTheBeep,
  oppositeDay,
  ruleFlip,
  sortTheStream,
  quickMaths,
  biggerTotal,
  timeItRight,
  orbitSwitch,
  flowLines,
  slideEscape,
  pathPainter,
  oneLineArt,
  laserLab,
  mergeGarden,
  miniNonogram,
  bridgeBuilder,
};
