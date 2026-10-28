import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import en from './en.json';

/**
 * All user-facing copy lives in en.json (CODE_STANDARDS › Copy). Keys are
 * `feature.screen.element`. Plurals use i18next's `_one` / `_other` suffixes via `count`
 * (Hermes ships Intl.PluralRules), never ternaries.
 */
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Non-React access (stores, services, notifications). */
export const t = i18n.t.bind(i18n);

/** React access; re-renders if the language ever changes. */
export function useT() {
  return useTranslation().t;
}

export default i18n;
