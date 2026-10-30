import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

// v1 schema starts fresh; the old scaffold's database is never opened again.
export const DB_NAME = 'untangle-v1.db';

export const sqlite = openDatabaseSync(DB_NAME, { enableChangeListener: true });
export const db = drizzle(sqlite, { schema });

export type Db = typeof db;
