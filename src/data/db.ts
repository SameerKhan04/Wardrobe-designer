import { randomUUID } from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import type { Garment, Outfit } from '@/core/types';

let opened: Promise<SQLite.SQLiteDatabase> | null = null;
const db = () =>
  (opened ??= (async () => {
    const d = await SQLite.openDatabaseAsync('wardrobe.db');
    await d.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS garments (
        id TEXT PRIMARY KEY NOT NULL, category TEXT NOT NULL, color TEXT NOT NULL DEFAULT '',
        formality TEXT NOT NULL, warmth TEXT NOT NULL, rainproof INTEGER NOT NULL, breathable INTEGER NOT NULL,
        availability TEXT NOT NULL, image_file TEXT, uploaded INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL, deleted_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS outfits (
        id TEXT PRIMARY KEY NOT NULL, name TEXT, tags TEXT NOT NULL DEFAULT '[]',
        top_id TEXT, bottom_id TEXT, shoes_id TEXT, outerwear_id TEXT,
        updated_at INTEGER NOT NULL, deleted_at INTEGER
      );
    `);
    return d;
  })());

export const newId = () => randomUUID();
/** Re-read everything on screen (e.g. after a picture finished downloading). */
export const refresh = () => changed();

// Two channels: `changed` refreshes the UI after any write; `edited` only fires for the user's own edits (it triggers a sync).
const uiListeners = new Set<() => void>();
const editListeners = new Set<() => void>();
function changed() {
  uiListeners.forEach((f) => f());
}
export const onLocalEdit = (f: () => void) => (editListeners.add(f), () => void editListeners.delete(f));

export function useLive<T>(load: () => Promise<T>, initial: T): T {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let alive = true;
    const run = () => void load().then((v) => alive && setValue(v));
    run();
    uiListeners.add(run);
    return () => {
      alive = false;
      uiListeners.delete(run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

type GarmentRow = Record<string, any>;
const toGarment = (r: GarmentRow): Garment => ({
  id: r.id,
  category: r.category,
  color: r.color,
  formality: r.formality,
  warmth: r.warmth,
  rainproof: !!r.rainproof,
  breathable: !!r.breathable,
  availability: r.availability,
  imageFile: r.image_file,
  uploaded: !!r.uploaded,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});
const toOutfit = (r: GarmentRow): Outfit => ({
  id: r.id,
  name: r.name,
  tags: JSON.parse(r.tags),
  topId: r.top_id,
  bottomId: r.bottom_id,
  shoesId: r.shoes_id,
  outerwearId: r.outerwear_id,
  updatedAt: r.updated_at,
  deletedAt: r.deleted_at,
});

/** Every row, including soft-deleted ones (sync needs the tombstones). */
export async function allGarments(): Promise<Garment[]> {
  return (await (await db()).getAllAsync<GarmentRow>('SELECT * FROM garments')).map(toGarment);
}
export async function allOutfits(): Promise<Outfit[]> {
  return (await (await db()).getAllAsync<GarmentRow>('SELECT * FROM outfits')).map(toOutfit);
}
export const liveGarments = async () => (await allGarments()).filter((g) => g.deletedAt === null);
export const liveOutfits = async () =>
  (await allOutfits()).filter((o) => o.deletedAt === null).sort((a, b) => b.updatedAt - a.updatedAt);

export const useGarments = () => useLive(liveGarments, [] as Garment[]);
export const useOutfits = () => useLive(liveOutfits, [] as Outfit[]);

/** Write a row exactly as given (used by sync, which must keep the remote `updatedAt`). */
export async function putGarment(g: Garment) {
  await (await db()).runAsync(
    `INSERT OR REPLACE INTO garments (id, category, color, formality, warmth, rainproof, breathable, availability, image_file, uploaded, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    g.id, g.category, g.color, g.formality, g.warmth, g.rainproof ? 1 : 0, g.breathable ? 1 : 0,
    g.availability, g.imageFile, g.uploaded ? 1 : 0, g.updatedAt, g.deletedAt,
  );
  changed();
}
export async function putOutfit(o: Outfit) {
  await (await db()).runAsync(
    `INSERT OR REPLACE INTO outfits (id, name, tags, top_id, bottom_id, shoes_id, outerwear_id, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    o.id, o.name, JSON.stringify(o.tags), o.topId, o.bottomId, o.shoesId, o.outerwearId, o.updatedAt, o.deletedAt,
  );
  changed();
}

/** The user's own edits: stamp `updatedAt` and ask for a sync. */
export async function saveGarment(g: Garment) {
  await putGarment({ ...g, updatedAt: Date.now() });
  editListeners.forEach((f) => f());
}
export async function saveOutfit(o: Outfit) {
  await putOutfit({ ...o, updatedAt: Date.now() });
  editListeners.forEach((f) => f());
}
export const deleteGarment = (g: Garment) => saveGarment({ ...g, deletedAt: Date.now() });
export const deleteOutfit = (o: Outfit) => saveOutfit({ ...o, deletedAt: Date.now() });

/** The upload flag is bookkeeping, not an edit: no `updatedAt` bump. */
export async function markUploaded(id: string) {
  await (await db()).runAsync('UPDATE garments SET uploaded = 1 WHERE id = ?', id);
}

export async function wipeLocal() {
  const d = await db();
  await d.execAsync('DELETE FROM garments; DELETE FROM outfits;');
  changed();
}
