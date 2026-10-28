import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';

import { db } from './db/client';
import { ledger, redemptions, vaultItems } from './db/schema';

/**
 * The points ledger (pack 2 Phase 9): every earn and spend is a row; balances are queries,
 * never stored numbers. Synchronous (expo-sqlite sync driver), so stores and screens can read it
 * directly. Writes never throw into the UI: a failed write is logged and retried by nothing — the
 * points are motivational, not money (EDGE_CASES › Rewards).
 */

export type LedgerKind = 'challenge' | 'rep' | 'focus' | 'spend' | 'bonus' | 'boss' | 'redeem';
export type LedgerVerification = 'verified' | 'timed' | 'word';

export type LedgerRow = {
  at: number;
  day: string;
  kind: LedgerKind;
  points: number;
  minutes: number;
  verification?: LedgerVerification | null;
  ref?: string | null;
};

export function insertLedgerRow(row: LedgerRow): void {
  try {
    db.insert(ledger)
      .values({
        at: row.at,
        day: row.day,
        kind: row.kind,
        points: row.points,
        minutes: row.minutes,
        verification: row.verification ?? null,
        ref: row.ref ?? null,
      })
      .run();
  } catch (e) {
    if (__DEV__) console.warn('[ledger] write failed', e);
  }
}

export type LedgerTotals = {
  points: number;
  minutes: number;
  /** Verified (or timed) points ÷ all earned points, 0–100; null before any earn. */
  verifiedPercent: number | null;
};

export function ledgerTotals(): LedgerTotals {
  try {
    const row = db
      .select({
        points: sql<number>`coalesce(sum(${ledger.points}), 0)`,
        minutes: sql<number>`coalesce(sum(${ledger.minutes}), 0)`,
        earned: sql<number>`coalesce(sum(case when ${ledger.points} > 0 then ${ledger.points} else 0 end), 0)`,
        verified: sql<number>`coalesce(sum(case when ${ledger.points} > 0 and ${ledger.verification} in ('verified', 'timed') then ${ledger.points} else 0 end), 0)`,
      })
      .from(ledger)
      .get();
    const earned = Number(row?.earned ?? 0);
    return {
      points: Number(row?.points ?? 0),
      minutes: Number(row?.minutes ?? 0),
      verifiedPercent: earned > 0 ? Math.round((Number(row?.verified ?? 0) / earned) * 100) : null,
    };
  } catch {
    return { points: 0, minutes: 0, verifiedPercent: null };
  }
}

export function ledgerSince(at: number) {
  try {
    return db.select().from(ledger).where(gte(ledger.at, at)).orderBy(desc(ledger.at)).all();
  } catch {
    return [];
  }
}

export function ledgerForDay(day: string) {
  try {
    return db.select().from(ledger).where(eq(ledger.day, day)).all();
  } catch {
    return [];
  }
}

// ---------- vault ----------

export type VaultSize = 'small' | 'medium' | 'big';
export type VaultItemRow = {
  id: string;
  name: string;
  size: VaultSize;
  cost: number;
  createdAt: number;
};

export function listVault(): VaultItemRow[] {
  try {
    return db
      .select({
        id: vaultItems.id,
        name: vaultItems.name,
        size: vaultItems.size,
        cost: vaultItems.cost,
        createdAt: vaultItems.createdAt,
      })
      .from(vaultItems)
      .where(isNull(vaultItems.archivedAt))
      .orderBy(vaultItems.cost)
      .all();
  } catch {
    return [];
  }
}

export function addVaultItem(item: VaultItemRow): void {
  try {
    db.insert(vaultItems).values(item).run();
  } catch (e) {
    if (__DEV__) console.warn('[vault] write failed', e);
  }
}

export function archiveVaultItem(id: string, at: number): void {
  try {
    db.update(vaultItems).set({ archivedAt: at }).where(eq(vaultItems.id, id)).run();
  } catch {
    // Non-fatal.
  }
}

/** Redeem: one redemption row + one negative ledger row, together. Returns the redemption id. */
export function redeem(args: {
  itemId: string;
  name: string;
  cost: number;
  at: number;
  day: string;
  verifiedPercent: number | null;
}): number | null {
  try {
    return db.transaction((tx) => {
      tx.insert(ledger)
        .values({
          at: args.at,
          day: args.day,
          kind: 'redeem',
          points: -args.cost,
          minutes: 0,
          ref: args.itemId,
        })
        .run();
      const r = tx
        .insert(redemptions)
        .values({
          itemId: args.itemId,
          at: args.at,
          cost: args.cost,
          verifiedPercent: args.verifiedPercent,
        })
        .returning({ id: redemptions.id })
        .get();
      return r?.id ?? null;
    });
  } catch (e) {
    if (__DEV__) console.warn('[vault] redeem failed', e);
    return null;
  }
}

/** Undo within the 5-second window: both rows go. */
export function undoRedeem(redemptionId: number, itemId: string, at: number): void {
  try {
    db.transaction((tx) => {
      tx.delete(redemptions).where(eq(redemptions.id, redemptionId)).run();
      tx.delete(ledger)
        .where(and(eq(ledger.kind, 'redeem'), eq(ledger.ref, itemId), eq(ledger.at, at)))
        .run();
    });
  } catch {
    // Non-fatal.
  }
}

export function setRedemptionPhoto(redemptionId: number, uri: string): void {
  try {
    db.update(redemptions).set({ photoUri: uri }).where(eq(redemptions.id, redemptionId)).run();
  } catch {
    // Non-fatal.
  }
}
