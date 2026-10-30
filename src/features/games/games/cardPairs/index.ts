import { lazy } from 'react';

import type { GameDefinition } from '../../engine/types';

/** The board loads on first play. */
export const definition: GameDefinition = {
  Round: lazy(() => import('./Round')),
  background: 'dots',
};
