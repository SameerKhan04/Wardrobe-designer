import { describe, expect, it } from 'vitest';
import { parseOpenMeteo } from './weather';

describe('parseOpenMeteo', () => {
  it('rounds the current temperature', () => {
    const w = parseOpenMeteo({ current: { temperature_2m: 18.6 }, daily: { precipitation_probability_max: [10] } });
    expect(w).toEqual({ tempC: 19, raining: false });
  });

  it('says raining only above 50 percent', () => {
    const at = (p: number) =>
      parseOpenMeteo({ current: { temperature_2m: 10 }, daily: { precipitation_probability_max: [p] } }).raining;
    expect(at(50)).toBe(false);
    expect(at(51)).toBe(true);
  });

  it('throws on a payload without a temperature', () => {
    expect(() => parseOpenMeteo({})).toThrow();
  });

  it('treats a missing precipitation forecast as dry', () => {
    expect(parseOpenMeteo({ current: { temperature_2m: 5 } }).raining).toBe(false);
  });
});
