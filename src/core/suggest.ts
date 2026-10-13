import { poolFor } from './mixer';
import type { Formality, Garment, Slots, Warmth, Weather } from './types';

type Rng = () => number;

const W: Record<Warmth, number> = { light: 0, mid: 1, heavy: 2 };
const F: Record<Formality, number> = { casual: 0, smart: 1, formal: 2 };

const targetWarmth = (t: number) => (t <= 8 ? 2 : t <= 16 ? 1 : 0);
const needsOuterwear = ({ tempC, raining }: Weather) => tempC <= 16 || raining;

function spreadPenalty(items: (Garment | null)[]) {
  const f = items.filter((g): g is Garment => !!g).map((g) => F[g.formality]);
  const spread = Math.max(...f) - Math.min(...f);
  return spread >= 2 ? 5 : spread; // formal + casual in one outfit is the one hard "no"
}

/**
 * Up to `n` outfits for the given weather. Rules, not stylist magic:
 * clean clothes only, warmth near the temperature, outerwear when cold or raining
 * (rainproof preferred), one formality band, no same-colour top and bottom.
 * ponytail: enumerates top x bottom x shoes; fine for a closet of a few hundred, switch to sampling past ~50 per row.
 */
export function suggestOutfits(garments: Garment[], weather: Weather, rng: Rng = Math.random, n = 3): Slots[] {
  const tops = poolFor('top', garments);
  if (!tops.length) return [];
  const bottoms = poolFor('bottom', garments);
  const shoes = poolFor('shoes', garments);
  const coats = poolFor('outerwear', garments);
  const target = targetWarmth(weather.tempC);
  const fit = (g: Garment) => -Math.abs(W[g.warmth] - target);
  const hot = weather.tempC >= 25;

  type Cand = { top: Garment; bottom: Garment | null; shoes: Garment | null; score: number };
  const cands: Cand[] = [];
  for (const top of tops) {
    for (const bottom of top.category === 'dress' ? [null] : bottoms.length ? bottoms : [null]) {
      for (const shoe of shoes.length ? shoes : [null]) {
        const score =
          2 * fit(top) +
          (bottom ? fit(bottom) : top.category === 'dress' ? fit(top) : 0) +
          (shoe ? fit(shoe) + (weather.raining && shoe.rainproof ? 2 : 0) : 0) +
          (hot && top.breathable ? 1 : 0) -
          spreadPenalty([top, bottom, shoe]) -
          (bottom && bottom.color && bottom.color === top.color ? 2 : 0) + // unknown colour ("") never clashes
          rng() * 0.5; // variety between shuffles without overturning a real preference
        cands.push({ top, bottom, shoes: shoe, score });
      }
    }
  }
  cands.sort((a, b) => b.score - a.score);

  // Prefer three different tops; fall back to the next-best combinations.
  const chosen: Cand[] = [];
  const seenTops = new Set<string>();
  for (const c of cands) {
    if (chosen.length < n && !seenTops.has(c.top.id)) {
      chosen.push(c);
      seenTops.add(c.top.id);
    }
  }
  for (const c of cands) if (chosen.length < n && !chosen.includes(c)) chosen.push(c);

  return chosen.map((c) => {
    let coat: Garment | null = null;
    if (needsOuterwear(weather) && coats.length) {
      const score = (g: Garment) =>
        fit(g) + (weather.raining && g.rainproof ? 3 : 0) - spreadPenalty([c.top, c.bottom, c.shoes, g]);
      coat = coats.reduce((best, g) => (score(g) > score(best) ? g : best));
    }
    return { top: c.top.id, bottom: c.bottom?.id ?? null, shoes: c.shoes?.id ?? null, outerwear: coat?.id ?? null };
  });
}
