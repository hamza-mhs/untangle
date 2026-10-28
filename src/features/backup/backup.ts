import { z } from 'zod';

import { db } from '@/storage/db/client';
import {
  days,
  emergencyPasses,
  focusSessions,
  ledger,
  redemptions,
  repResults,
  vaultItems,
} from '@/storage/db/schema';
import { kv, STORE_KEYS } from '@/storage/kv';

/**
 * Backup export / import (pack 2 SPEC › Settings), pure-ish: builds and restores one versioned
 * JSON document. It holds rules, challenge history, points, vault, settings and clarity, but NOT
 * app selections (iOS selection tokens don't move between devices; Android package lists are
 * per-install), so after an import the user re-picks their apps. Entitlement and the lock state
 * stay with the device.
 */
export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'untangle';

const EXCLUDED_STORES = new Set<string>([STORE_KEYS.entitlement, STORE_KEYS.lock]);

const TABLES = {
  days,
  focusSessions,
  ledger,
  repResults,
  emergencyPasses,
  vaultItems,
  redemptions,
} as const;
type TableName = keyof typeof TABLES;
const TABLE_NAMES = Object.keys(TABLES) as TableName[];

const rowSchema = z.record(z.string(), z.unknown());

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.number().int().positive(),
  exportedAt: z.number(),
  stores: z.record(z.string(), z.string()),
  tables: z.object(
    Object.fromEntries(TABLE_NAMES.map((n) => [n, z.array(rowSchema)])) as Record<
      TableName,
      z.ZodArray<typeof rowSchema>
    >,
  ),
});

export type Backup = z.infer<typeof backupSchema>;

export type ParseResult = { ok: true; backup: Backup } | { ok: false; reason: 'invalid' | 'newer' };

/** Rules keep their schedules and strengths; the app picks are emptied. */
function withoutSelections(key: string, raw: string): string {
  if (key !== STORE_KEYS.rules) return raw;
  try {
    const parsed = JSON.parse(raw) as { state?: { rules?: { apps?: unknown }[] } };
    for (const rule of parsed.state?.rules ?? []) {
      const apps = rule.apps as { platform?: string } | undefined;
      rule.apps =
        apps?.platform === 'ios'
          ? { platform: 'ios', token: '', count: 0 }
          : { platform: 'android', packages: [] };
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

export function buildBackup(now = Date.now()): Backup {
  const stores: Record<string, string> = {};
  for (const key of Object.values(STORE_KEYS)) {
    if (EXCLUDED_STORES.has(key)) continue;
    const raw = kv.getString(key);
    if (raw !== undefined) stores[key] = withoutSelections(key, raw);
  }
  const tables = Object.fromEntries(
    TABLE_NAMES.map((n) => [n, db.select().from(TABLES[n]).all() as Record<string, unknown>[]]),
  ) as Backup['tables'];
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now, stores, tables };
}

export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  const version = (json as { version?: unknown } | null)?.version;
  if (typeof version === 'number' && version > BACKUP_VERSION)
    return { ok: false, reason: 'newer' };
  const parsed = backupSchema.safeParse(json);
  return parsed.success ? { ok: true, backup: parsed.data } : { ok: false, reason: 'invalid' };
}

/** Replaces everything on this phone. SQLite in one transaction, then the KV stores. */
export function restoreBackup(backup: Backup): void {
  db.transaction((tx) => {
    for (const n of TABLE_NAMES) {
      const table = TABLES[n];
      tx.delete(table).run();
      const rows = backup.tables[n];
      if (rows.length > 0)
        tx.insert(table)
          .values(rows as never)
          .run();
    }
  });
  for (const key of Object.values(STORE_KEYS)) {
    if (EXCLUDED_STORES.has(key)) continue;
    const raw = backup.stores[key];
    if (raw === undefined) kv.remove(key);
    else kv.set(key, raw);
  }
}

/** untangle-backup-2026-10-25.json */
export function backupFileName(now = Date.now()): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `untangle-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
