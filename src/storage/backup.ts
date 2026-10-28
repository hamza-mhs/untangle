import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from './db/client';
import * as schema from './db/schema';
import { kv, STORE_KEYS } from './kv';

/**
 * Local backup file: every persisted store + every SQLite table as one JSON document.
 * No account / cloud — the user saves it wherever the share sheet offers (Files, Drive, …).
 */

export const BACKUP_VERSION = 1;

export type BackupFile = {
  app: 'untangle';
  version: number;
  exportedAt: number;
  kv: Record<string, string | null>;
  tables: {
    days: (typeof schema.days.$inferSelect)[];
    focusSessions: (typeof schema.focusSessions.$inferSelect)[];
    ledger: (typeof schema.ledger.$inferSelect)[];
    repResults: (typeof schema.repResults.$inferSelect)[];
    emergencyPasses: (typeof schema.emergencyPasses.$inferSelect)[];
  };
};

export async function buildBackup(): Promise<BackupFile> {
  const kvDump = Object.fromEntries(
    Object.values(STORE_KEYS).map((k) => [k, kv.getString(k) ?? null]),
  );
  return {
    app: 'untangle',
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    kv: kvDump,
    tables: {
      days: await db.select().from(schema.days),
      focusSessions: await db.select().from(schema.focusSessions),
      ledger: await db.select().from(schema.ledger),
      repResults: await db.select().from(schema.repResults),
      emergencyPasses: await db.select().from(schema.emergencyPasses),
    },
  };
}

export function parseBackup(json: string): BackupFile {
  const data = JSON.parse(json) as Partial<BackupFile>;
  if (data.app !== 'untangle' || typeof data.version !== 'number' || !data.tables || !data.kv) {
    throw new Error('Not an Untangle backup file');
  }
  if (data.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of Untangle');
  }
  return data as BackupFile;
}

export async function exportBackup(): Promise<void> {
  const backup = await buildBackup();
  const file = new File(
    Paths.cache,
    `untangle-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
  file.create({ overwrite: true });
  await file.write(JSON.stringify(backup));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}

/** Replaces all local data with the backup. Caller should reload stores afterwards. */
export async function importBackup(): Promise<boolean> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return false;
  const backup = parseBackup(await picked.result.text());

  await db.transaction(async (tx) => {
    await tx.delete(schema.days);
    await tx.delete(schema.focusSessions);
    await tx.delete(schema.ledger);
    await tx.delete(schema.repResults);
    await tx.delete(schema.emergencyPasses);
    const t = backup.tables;
    if (t.days.length) await tx.insert(schema.days).values(t.days);
    if (t.focusSessions.length) await tx.insert(schema.focusSessions).values(t.focusSessions);
    if (t.ledger.length) await tx.insert(schema.ledger).values(t.ledger);
    if (t.repResults.length) await tx.insert(schema.repResults).values(t.repResults);
    if (t.emergencyPasses.length) await tx.insert(schema.emergencyPasses).values(t.emergencyPasses);
  });
  for (const [k, v] of Object.entries(backup.kv)) {
    if (v === null) kv.remove(k);
    else kv.set(k, v);
  }
  return true;
}
