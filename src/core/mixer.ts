import { SLOT_KEYS, type Category, type Garment, type SlotKey, type Slots } from './types';

type Rng = () => number;

const ROW: Record<SlotKey, Category[]> = {
  top: ['top', 'dress'], // a dress rides in the top row and empties the bottom row
  bottom: ['bottom'],
  shoes: ['shoes'],
  outerwear: ['outerwear'],
};

const wearable = (g: Garment) => g.availability === 'clean' && g.deletedAt === null;

export function poolFor(slot: SlotKey, garments: Garment[]): Garment[] {
  return garments.filter((g) => wearable(g) && ROW[slot].includes(g.category));
}

/** Random pick that avoids repeating `avoidId` whenever another choice exists. */
function pick(pool: Garment[], avoidId: string | null, rng: Rng): string | null {
  const fresh = pool.filter((g) => g.id !== avoidId);
  const from = fresh.length ? fresh : pool;
  return from.length ? from[Math.min(from.length - 1, Math.floor(rng() * from.length))].id : null;
}

/** Re-roll every unlocked row. Locked rows keep their garment. */
export function shuffle(current: Slots, locked: SlotKey[], garments: Garment[], rng: Rng = Math.random): Slots {
  const byId = new Map(garments.map((g) => [g.id, g]));
  const isDress = (id: string | null) => !!id && byId.get(id)?.category === 'dress';
  const keeps = (k: SlotKey) => locked.includes(k) && current[k] !== null;

  let topPool = poolFor('top', garments);
  if (keeps('bottom')) topPool = topPool.filter((g) => g.category !== 'dress'); // a locked bottom needs a top, not a dress
  const top = locked.includes('top') ? current.top : pick(topPool, current.top, rng);

  const bottom = isDress(top)
    ? null
    : keeps('bottom')
      ? current.bottom
      : pick(poolFor('bottom', garments), current.bottom, rng);

  const shoes = locked.includes('shoes') ? current.shoes : pick(poolFor('shoes', garments), current.shoes, rng);

  // Outerwear is optional: off stays off, on gets re-rolled unless locked.
  const outerwear =
    current.outerwear === null || locked.includes('outerwear')
      ? current.outerwear
      : pick(poolFor('outerwear', garments), current.outerwear, rng);

  return { top, bottom, shoes, outerwear };
}

/**
 * Fix only the rows that went stale (garment deleted or sent to the laundry, or a row that can be filled now).
 * Returns the same object when nothing is wrong, so it is safe to call from an effect.
 */
export function repair(current: Slots, locked: SlotKey[], garments: Garment[], rng: Rng = Math.random): Slots {
  const byId = new Map(garments.map((g) => [g.id, g]));
  const ok = (k: SlotKey): boolean => {
    const id = current[k];
    if (id) return poolFor(k, garments).some((g) => g.id === id) || (locked.includes(k) && byId.has(id));
    if (k === 'outerwear') return true;
    if (k === 'bottom' && byId.get(current.top ?? '')?.category === 'dress') return true;
    return poolFor(k, garments).length === 0;
  };
  const broken = SLOT_KEYS.filter((k) => !ok(k));
  if (!broken.length) return current;
  return shuffle(current, SLOT_KEYS.filter((k) => !broken.includes(k)), garments, rng);
}

export function toggleOuterwear(current: Slots, garments: Garment[], rng: Rng = Math.random): Slots {
  if (current.outerwear) return { ...current, outerwear: null };
  return { ...current, outerwear: pick(poolFor('outerwear', garments), null, rng) };
}
