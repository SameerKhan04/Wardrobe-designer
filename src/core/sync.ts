/**
 * Last write wins by `updatedAt`. Compares whole sets (a closet is hundreds of rows, not millions).
 * ponytail: relies on device clocks; a badly skewed phone can overwrite a newer edit. Upgrade: server-side `updated_at` trigger.
 */
export function planSync<T extends { id: string; updatedAt: number }>(local: T[], remote: T[]) {
  const remoteById = new Map(remote.map((r) => [r.id, r]));
  const localIds = new Set(local.map((l) => l.id));
  const push: T[] = [];
  const pull: T[] = [];
  for (const l of local) {
    const r = remoteById.get(l.id);
    if (!r || l.updatedAt > r.updatedAt) push.push(l);
    else if (l.updatedAt < r.updatedAt) pull.push(r);
  }
  for (const r of remote) if (!localIds.has(r.id)) pull.push(r);
  return { push, pull };
}
