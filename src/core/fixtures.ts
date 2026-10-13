import type { Garment } from './types';

let n = 0;
export function garment(over: Partial<Garment> = {}): Garment {
  n += 1;
  return {
    id: `g${n}`,
    category: 'top',
    color: 'white',
    formality: 'casual',
    warmth: 'mid',
    rainproof: false,
    breathable: false,
    availability: 'clean',
    imageFile: null,
    uploaded: false,
    updatedAt: 1,
    deletedAt: null,
    ...over,
  };
}

/** Deterministic rng: cycles through the given values in [0,1). */
export function seq(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}
