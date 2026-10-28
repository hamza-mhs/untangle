import { create } from 'zustand';

/** One app-wide toast at a time (E08 "Pro restored"). Rendered by <ToastHost> at the root. */
export type ToastMessage = { title: string; sub?: string; tone: 'success' | 'neutral' };

type ToastStore = {
  toast: (ToastMessage & { id: number }) | null;
  show: (m: ToastMessage) => void;
  hide: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  show: (m) => set({ toast: { ...m, id: Date.now() } }),
  hide: () => set({ toast: null }),
}));

export const showToast = (m: ToastMessage) => useToastStore.getState().show(m);
