/** Toggle with an optional cap. Returns null when the cap blocks the add (caller warns). */
export function toggleCapped<T>(list: readonly T[], id: T, max = Infinity): T[] | null {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (list.length >= max) return null;
  return [...list, id];
}
