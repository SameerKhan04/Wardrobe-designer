import { describe, expect, it } from 'vitest';
import { centerSquare } from './crop';

describe('centerSquare', () => {
  it('crops a portrait photo to a centred square of the width', () => {
    expect(centerSquare(3000, 4000)).toEqual({ originX: 0, originY: 500, width: 3000, height: 3000 });
  });
  it('crops a landscape photo to a centred square of the height', () => {
    expect(centerSquare(4000, 3000)).toEqual({ originX: 500, originY: 0, width: 3000, height: 3000 });
  });
  it('leaves a square alone', () => {
    expect(centerSquare(800, 800)).toEqual({ originX: 0, originY: 0, width: 800, height: 800 });
  });
  it('rounds odd sizes to whole pixels', () => {
    const r = centerSquare(1001, 1500);
    expect(Number.isInteger(r.originY)).toBe(true);
    expect(r.width).toBe(1001);
  });
});
