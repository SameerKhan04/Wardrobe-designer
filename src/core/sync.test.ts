import { describe, expect, it } from 'vitest';
import { planSync } from './sync';

const row = (id: string, updatedAt: number) => ({ id, updatedAt });

describe('planSync (last write wins)', () => {
  it('pushes rows only the device has and pulls rows only the cloud has', () => {
    const { push, pull } = planSync([row('a', 1)], [row('b', 1)]);
    expect(push.map((r) => r.id)).toEqual(['a']);
    expect(pull.map((r) => r.id)).toEqual(['b']);
  });

  it('the newer side wins', () => {
    const { push, pull } = planSync([row('a', 5), row('b', 1)], [row('a', 2), row('b', 9)]);
    expect(push.map((r) => r.id)).toEqual(['a']);
    expect(pull.map((r) => r.id)).toEqual(['b']);
  });

  it('identical timestamps do nothing', () => {
    expect(planSync([row('a', 3)], [row('a', 3)])).toEqual({ push: [], pull: [] });
  });

  it('is settled after applying the plan', () => {
    const local = [row('a', 5), row('c', 1)];
    const remote = [row('a', 2), row('b', 4)];
    const { push, pull } = planSync(local, remote);
    const merged = new Map([...local, ...pull, ...push].map((r) => [r.id, r]));
    const next = [...merged.values()];
    expect(planSync(next, next)).toEqual({ push: [], pull: [] });
  });
});
