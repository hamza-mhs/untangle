import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import app from './en/app.json';
import common from './en/common.json';
import dev from './en/dev.json';
import focus from './en/focus.json';
import games from './en/games.json';
import home from './en/home.json';
import locks from './en/locks.json';
import onboarding from './en/onboarding.json';
import pause from './en/pause.json';
import progress from './en/progress.json';
import settings from './en/settings.json';
import paywall from './en/paywall.json';
import tabs from './en/tabs.json';

/**
 * All user-facing copy lives in src/i18n/en/*.json, one file per area. Keys are
 * `area.screen.element`. Plurals use i18next's `_one` / `_other` suffixes via `count`.
 */
export const en = {
  ...app,
  ...common,
  ...dev,
  ...focus,
  ...games,
  ...home,
  ...locks,
  ...onboarding,
  ...pause,
  ...paywall,
  ...progress,
  ...settings,
  ...tabs,
};

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Non-React access (stores, services). */
export const t = i18n.t.bind(i18n);

/** React access; re-renders if the language ever changes. */
export function useT() {
  return useTranslation().t;
}

export default i18n;
