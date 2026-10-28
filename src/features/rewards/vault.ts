import { create } from 'zustand';

import { useScoringStore } from '@/features/scoring/store';
import { dayKey } from '@/lib/time';
import {
  addVaultItem,
  archiveVaultItem,
  ledgerTotals,
  listVault,
  redeem,
  undoRedeem,
  type VaultItemRow,
  type VaultSize,
} from '@/storage/ledgerRepo';

/**
 * The reward vault (FRewards / FRedeem): things the user picks for themselves and unlocks with
 * points. Rows live in SQLite; this store is the in-memory list the screens read.
 */
export const VAULT_SIZES: readonly VaultSize[] = ['small', 'medium', 'big'];
export const SUGGESTED_COST: Record<VaultSize, number> = { small: 300, medium: 1500, big: 5000 };
export const UNDO_MS = 5000;

export type Redemption = { id: number; itemId: string; cost: number; at: number };

type VaultStore = {
  items: VaultItemRow[];
  /** The redemption FRedeem is showing (its Undo window). */
  last: Redemption | null;
  load: () => void;
  add: (name: string, size: VaultSize, cost: number, now?: number) => void;
  archive: (id: string, now?: number) => void;
  /** Deducts the points now and logs the redemption; `undo` reverses it within UNDO_MS. */
  redeem: (item: VaultItemRow, now?: number) => Redemption | null;
  undo: (r: Redemption) => void;
};

export const useVaultStore = create<VaultStore>((set, get) => ({
  items: [],
  last: null,
  load: () => set({ items: listVault() }),
  add: (name, size, cost, now = Date.now()) => {
    addVaultItem({ id: `vault-${now}`, name: name.trim(), size, cost, createdAt: now });
    get().load();
  },
  archive: (id, now = Date.now()) => {
    archiveVaultItem(id, now);
    get().load();
  },
  redeem: (item, now = Date.now()) => {
    const scoring = useScoringStore.getState();
    if (scoring.points < item.cost) return null;
    const id = redeem({
      itemId: item.id,
      name: item.name,
      cost: item.cost,
      at: now,
      day: dayKey(now),
      verifiedPercent: ledgerTotals().verifiedPercent,
    });
    if (id === null) return null;
    scoring.applyRedeem(item.cost);
    const r = { id, itemId: item.id, cost: item.cost, at: now };
    set({ last: r });
    return r;
  },
  undo: (r) => {
    undoRedeem(r.id, r.itemId, r.at);
    useScoringStore.getState().applyRedeem(-r.cost);
    set({ last: null });
  },
}));

/** "260 to Dinner out": the cheapest item still out of reach. */
export function nextGoal(
  items: readonly VaultItemRow[],
  points: number,
): { item: VaultItemRow; toGo: number } | null {
  const ahead = items.filter((i) => i.cost > points).sort((a, b) => a.cost - b.cost);
  return ahead[0] ? { item: ahead[0], toGo: ahead[0].cost - points } : null;
}
