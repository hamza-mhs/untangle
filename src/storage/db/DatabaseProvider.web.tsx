import type { ReactNode } from 'react';

/**
 * Web is a design preview only: skip SQLite (expo-sqlite on web needs extra wasm + COOP/COEP
 * headers). Nothing on the onboarding screens reads the database.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  return children;
}
