import { useSyncExternalStore } from 'react';
import type { SlotKey, Slots } from '@/core/types';

/** What the mixer is showing. Module-level so Today and Looks can load an outfit into it from another tab. */
type State = { slots: Slots; locked: SlotKey[] };
let state: State = { slots: { top: null, bottom: null, shoes: null, outerwear: null }, locked: [] };
const subs = new Set<() => void>();

export function setMixer(next: Partial<State>) {
  state = { ...state, ...next };
  subs.forEach((f) => f());
}
const subscribe = (f: () => void) => (subs.add(f), () => void subs.delete(f));
export const useMixer = () => useSyncExternalStore(subscribe, () => state);
