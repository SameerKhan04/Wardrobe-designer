import { describe, expect, it } from 'vitest';
import { garment, seq } from './fixtures';
import { poolFor, repair, shuffle, toggleOuterwear } from './mixer';
import type { Slots } from './types';

const empty: Slots = { top: null, bottom: null, shoes: null, outerwear: null };

describe('poolFor', () => {
  it('only offers clean, undeleted garments of that row', () => {
    const clean = garment({ category: 'bottom' });
    const laundry = garment({ category: 'bottom', availability: 'laundry' });
    const dry = garment({ category: 'bottom', availability: 'dry_cleaners' });
    const gone = garment({ category: 'bottom', deletedAt: 5 });
    const shoe = garment({ category: 'shoes' });
    expect(poolFor('bottom', [clean, laundry, dry, gone, shoe]).map((g) => g.id)).toEqual([clean.id]);
  });

  it('puts dresses in the top row and keeps accessories out of every row', () => {
    const top = garment({ category: 'top' });
    const dress = garment({ category: 'dress' });
    const acc = garment({ category: 'accessory' });
    expect(poolFor('top', [top, dress, acc]).map((g) => g.id).sort()).toEqual([top.id, dress.id].sort());
  });
});

describe('shuffle', () => {
  const top1 = garment({ category: 'top' });
  const top2 = garment({ category: 'top' });
  const bottom1 = garment({ category: 'bottom' });
  const bottom2 = garment({ category: 'bottom' });
  const shoes1 = garment({ category: 'shoes' });
  const shoes2 = garment({ category: 'shoes' });
  const all = [top1, top2, bottom1, bottom2, shoes1, shoes2];

  it('keeps locked slots and changes the unlocked ones', () => {
    const current: Slots = { top: top1.id, bottom: bottom1.id, shoes: shoes1.id, outerwear: null };
    const next = shuffle(current, ['bottom'], all, seq(0.1, 0.9));
    expect(next.bottom).toBe(bottom1.id);
    expect(next.top).toBe(top2.id);
    expect(next.shoes).toBe(shoes2.id);
  });

  it('never picks the same item again when another exists', () => {
    const current: Slots = { top: top1.id, bottom: bottom1.id, shoes: shoes1.id, outerwear: null };
    for (const r of [0, 0.3, 0.5, 0.99]) {
      expect(shuffle(current, [], all, seq(r)).top).toBe(top2.id);
    }
  });

  it('leaves outerwear off when the user turned it off', () => {
    const jacket = garment({ category: 'outerwear' });
    expect(shuffle(empty, [], [...all, jacket], seq(0.5)).outerwear).toBeNull();
  });

  it('reshuffles outerwear when it is on and unlocked', () => {
    const j1 = garment({ category: 'outerwear' });
    const j2 = garment({ category: 'outerwear' });
    const current: Slots = { ...empty, outerwear: j1.id };
    expect(shuffle(current, [], [...all, j1, j2], seq(0.5)).outerwear).toBe(j2.id);
  });

  it('a dress in the top row empties the bottom row', () => {
    const dress = garment({ category: 'dress' });
    const current: Slots = { top: top1.id, bottom: bottom1.id, shoes: shoes1.id, outerwear: null };
    const next = shuffle(current, [], [dress, bottom1, bottom2, shoes1, shoes2], seq(0.5));
    expect(next.top).toBe(dress.id);
    expect(next.bottom).toBeNull();
  });

  it('refills the bottom row when the top leaves a dress behind', () => {
    const dress = garment({ category: 'dress' });
    const current: Slots = { top: dress.id, bottom: null, shoes: shoes1.id, outerwear: null };
    const next = shuffle(current, [], [top1, bottom1, shoes1], seq(0.5));
    expect(next.top).toBe(top1.id);
    expect(next.bottom).toBe(bottom1.id);
  });

  it('gives null for a row with nothing clean', () => {
    const next = shuffle(empty, [], [top1], seq(0.5));
    expect(next.top).toBe(top1.id);
    expect(next.bottom).toBeNull();
    expect(next.shoes).toBeNull();
  });
});

describe('toggleOuterwear', () => {
  const jacket = garment({ category: 'outerwear' });
  it('turns on with a clean jacket and off again', () => {
    const on = toggleOuterwear(empty, [jacket], seq(0.5));
    expect(on.outerwear).toBe(jacket.id);
    expect(toggleOuterwear(on, [jacket]).outerwear).toBeNull();
  });
  it('stays off when there is no clean jacket', () => {
    expect(toggleOuterwear(empty, []).outerwear).toBeNull();
  });
});

describe('repair', () => {
  const top = garment({ category: 'top' });
  const top2 = garment({ category: 'top' });
  const bottom = garment({ category: 'bottom' });
  const shoes = garment({ category: 'shoes' });
  const dress = garment({ category: 'dress' });
  const fine: Slots = { top: top.id, bottom: bottom.id, shoes: shoes.id, outerwear: null };

  it('returns the very same object when nothing needs fixing', () => {
    expect(repair(fine, [], [top, bottom, shoes])).toBe(fine);
  });

  it('fills an empty row as soon as a clean item exists, leaving the others alone', () => {
    const next = repair({ ...fine, top: null }, [], [top, bottom, shoes], seq(0.5));
    expect(next).toEqual(fine);
  });

  it('replaces a row whose garment went to the laundry', () => {
    const wash = { ...top, availability: 'laundry' as const };
    const next = repair(fine, [], [wash, top2, bottom, shoes], seq(0.5));
    expect(next.top).toBe(top2.id);
    expect(next.bottom).toBe(bottom.id);
  });

  it('is fine with no bottom under a dress, and with no jacket', () => {
    const wearingDress: Slots = { top: dress.id, bottom: null, shoes: shoes.id, outerwear: null };
    expect(repair(wearingDress, [], [dress, bottom, shoes])).toBe(wearingDress);
  });

  it('leaves a row empty when nothing clean is left for it', () => {
    const gone = { ...shoes, availability: 'dry_cleaners' as const };
    expect(repair(fine, [], [top, bottom, gone]).shoes).toBeNull();
  });

  it('drops a row whose garment was deleted outright', () => {
    expect(repair({ ...fine, shoes: 'missing' }, [], [top, bottom]).shoes).toBeNull();
  });
});