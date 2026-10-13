import { describe, expect, it } from 'vitest';
import { garment, seq } from './fixtures';
import { suggestOutfits } from './suggest';
import type { Garment } from './types';

const closet = (): Record<string, Garment> => ({
  tee: garment({ category: 'top', warmth: 'light', color: 'white' }),
  knit: garment({ category: 'top', warmth: 'heavy', color: 'cream' }),
  jeans: garment({ category: 'bottom', warmth: 'mid', color: 'blue' }),
  shorts: garment({ category: 'bottom', warmth: 'light', color: 'khaki' }),
  sneakers: garment({ category: 'shoes' }),
  boots: garment({ category: 'shoes', rainproof: true, warmth: 'heavy' }),
  parka: garment({ category: 'outerwear', warmth: 'heavy', rainproof: true }),
  blazer: garment({ category: 'outerwear', warmth: 'light', formality: 'smart' }),
});

const list = (c: Record<string, Garment>) => Object.values(c);

describe('suggestOutfits', () => {
  it('cold and rainy gives a heavy, rainproof set with outerwear', () => {
    const c = closet();
    const [first] = suggestOutfits(list(c), { tempC: 8, raining: true }, seq(0.5));
    expect(first.top).toBe(c.knit.id);
    expect(first.outerwear).toBe(c.parka.id);
    expect(first.shoes).toBe(c.boots.id);
  });

  it('hot and dry gives a light set without outerwear', () => {
    const c = closet();
    const [first] = suggestOutfits(list(c), { tempC: 28, raining: false }, seq(0.5));
    expect(first.top).toBe(c.tee.id);
    expect(first.bottom).toBe(c.shorts.id);
    expect(first.outerwear).toBeNull();
  });

  it('rain alone adds outerwear even when it is mild', () => {
    const c = closet();
    const [first] = suggestOutfits(list(c), { tempC: 20, raining: true }, seq(0.5));
    expect(first.outerwear).toBe(c.parka.id);
  });

  it('never suggests anything in the laundry or at the dry cleaners', () => {
    const c = closet();
    c.parka.availability = 'laundry';
    c.boots.availability = 'dry_cleaners';
    const outs = suggestOutfits(list(c), { tempC: 8, raining: true }, seq(0.2, 0.7));
    const used = outs.flatMap((o) => [o.top, o.bottom, o.shoes, o.outerwear]);
    expect(used).not.toContain(c.parka.id);
    expect(used).not.toContain(c.boots.id);
  });

  it('returns at most three outfits and no duplicates', () => {
    const c = closet();
    const outs = suggestOutfits(list(c), { tempC: 15, raining: false }, seq(0.1, 0.4, 0.8));
    expect(outs.length).toBeLessThanOrEqual(3);
    const keys = outs.map((o) => [o.top, o.bottom, o.shoes, o.outerwear].join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('avoids pairing a formal piece with a casual one when it can', () => {
    const suit = garment({ category: 'top', formality: 'formal', warmth: 'mid' });
    const tee = garment({ category: 'top', formality: 'casual', warmth: 'mid' });
    const trousers = garment({ category: 'bottom', formality: 'formal', warmth: 'mid' });
    const shoes = garment({ category: 'shoes', formality: 'formal' });
    const outs = suggestOutfits([suit, tee, trousers, shoes], { tempC: 15, raining: false }, seq(0.5));
    expect(outs[0].top).toBe(suit.id);
  });

  it('avoids the same colour on top and bottom when there is a choice', () => {
    const red1 = garment({ category: 'top', color: 'red' });
    const red2 = garment({ category: 'bottom', color: 'red' });
    const blue = garment({ category: 'bottom', color: 'blue' });
    const shoes = garment({ category: 'shoes' });
    const outs = suggestOutfits([red1, red2, blue, shoes], { tempC: 15, raining: false }, seq(0.5));
    expect(outs[0].bottom).toBe(blue.id);
  });

  it('does not treat two unknown colours as a clash', () => {
    // hot day: the unknown-colour light bottom is the better fit; the blue mid bottom is slightly worse
    const top = garment({ category: 'top', color: '', warmth: 'light' });
    const unknown = garment({ category: 'bottom', color: '', warmth: 'light' });
    const blueMid = garment({ category: 'bottom', color: 'blue', warmth: 'mid' });
    const shoes = garment({ category: 'shoes', warmth: 'light' });
    const outs = suggestOutfits([top, unknown, blueMid, shoes], { tempC: 28, raining: false }, seq(0.5));
    expect(outs[0].bottom).toBe(unknown.id);
  });

  it('a dress needs no bottom', () => {
    const dress = garment({ category: 'dress', warmth: 'light' });
    const shoes = garment({ category: 'shoes' });
    const outs = suggestOutfits([dress, shoes], { tempC: 28, raining: false }, seq(0.5));
    expect(outs[0]).toMatchObject({ top: dress.id, bottom: null, shoes: shoes.id });
  });

  it('returns nothing when there is nothing clean to wear', () => {
    expect(suggestOutfits([], { tempC: 15, raining: false })).toEqual([]);
  });
});
