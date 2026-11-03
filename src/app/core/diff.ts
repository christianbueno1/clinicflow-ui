export function diff<T extends object>(next: T, prev: T): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (next[key] !== prev[key]) changes[key] = next[key];
  }
  return changes;
}