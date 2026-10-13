import 'expo-sqlite/localStorage/install';
import { createClient, type Session } from '@supabase/supabase-js';
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { planSync } from '@/core/sync';
import type { Garment, Outfit } from '@/core/types';
import { allGarments, allOutfits, markUploaded, onLocalEdit, putGarment, putOutfit, refresh, wipeLocal } from './db';
import { garmentsDir, removeAllImages } from './files';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False until a Supabase project is filled in `.env`; the app then runs fully local. */
export const cloudConfigured = !!(url && key);

export const supabase = cloudConfigured
  ? createClient(url!, key!, {
      auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

const BUCKET = 'garments';

// ---------- session ----------
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(cloudConfigured ? undefined : null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export const signUp = (email: string, password: string) => supabase!.auth.signUp({ email, password });
export const signIn = (email: string, password: string) => supabase!.auth.signInWithPassword({ email, password });
export const signOut = () => supabase!.auth.signOut();

/** Play Store requirement: in-app account deletion. The Edge Function removes rows, files, then the auth user. */
export async function deleteAccount() {
  const { error } = await supabase!.functions.invoke('delete-account');
  if (error) throw error;
  await supabase!.auth.signOut({ scope: 'local' });
  removeAllImages();
  await wipeLocal();
}

// ---------- sync status ----------
type Status = { state: 'idle' | 'syncing' | 'error'; last: number | null; error: string | null };
let status: Status = { state: 'idle', last: null, error: null };
const subs = new Set<() => void>();
const setStatus = (s: Status) => ((status = s), subs.forEach((f) => f()));
const subscribe = (f: () => void) => (subs.add(f), () => void subs.delete(f));
export const useSyncStatus = () => useSyncExternalStore(subscribe, () => status);

// ---------- row mapping ----------
const toRemoteGarment = (uid: string, g: Garment, imagePath: string | null) => ({
  id: g.id, user_id: uid, category: g.category, color: g.color, formality: g.formality, warmth: g.warmth,
  rainproof: g.rainproof, breathable: g.breathable, availability: g.availability,
  image_path: imagePath, updated_at: g.updatedAt, deleted_at: g.deletedAt,
});
const fromRemoteGarment = (r: any, local?: Garment): Garment => ({
  id: r.id, category: r.category, color: r.color, formality: r.formality, warmth: r.warmth,
  rainproof: r.rainproof, breathable: r.breathable, availability: r.availability,
  imageFile: local?.imageFile ?? (r.image_path ? String(r.image_path).split('/').pop()! : null),
  uploaded: !!r.image_path, updatedAt: Number(r.updated_at), deletedAt: r.deleted_at === null ? null : Number(r.deleted_at),
});
const toRemoteOutfit = (uid: string, o: Outfit) => ({
  id: o.id, user_id: uid, name: o.name, tags: o.tags, top_id: o.topId, bottom_id: o.bottomId,
  shoes_id: o.shoesId, outerwear_id: o.outerwearId, updated_at: o.updatedAt, deleted_at: o.deletedAt,
});
const fromRemoteOutfit = (r: any): Outfit => ({
  id: r.id, name: r.name, tags: r.tags ?? [], topId: r.top_id, bottomId: r.bottom_id, shoesId: r.shoes_id,
  outerwearId: r.outerwear_id, updatedAt: Number(r.updated_at), deletedAt: r.deleted_at === null ? null : Number(r.deleted_at),
});

// ---------- images ----------
async function uploadImage(uid: string, g: Garment) {
  const file = new File(garmentsDir(), g.imageFile!);
  if (!file.exists) return null;
  const path = `${uid}/${g.imageFile}`;
  const { error } = await supabase!.storage.from(BUCKET).upload(path, await file.bytes(), {
    contentType: g.imageFile!.endsWith('.png') ? 'image/png' : 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  await markUploaded(g.id);
  return path;
}

async function downloadImage(uid: string, g: Garment) {
  const { data, error } = await supabase!.storage.from(BUCKET).createSignedUrl(`${uid}/${g.imageFile}`, 120);
  if (error) throw error;
  await File.downloadFileAsync(data.signedUrl, new File(new Directory(Paths.document, 'garments'), g.imageFile!), {
    idempotent: true,
  });
}

// ---------- sync ----------
let running: Promise<void> | null = null;
/** One sync at a time; callers during a run share it. */
export const syncNow = () => (running ??= run().finally(() => (running = null)));

async function run() {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  setStatus({ ...status, state: 'syncing', error: null });
  try {
    // garments
    const { data: rg, error: eg } = await supabase.from('garments').select('*');
    if (eg) throw eg;
    const local = await allGarments();
    const byId = new Map(local.map((g) => [g.id, g]));
    const plan = planSync(local, (rg ?? []).map((r) => fromRemoteGarment(r, byId.get(r.id))));
    for (const g of plan.push) {
      const path = g.imageFile && g.deletedAt === null ? (g.uploaded ? `${uid}/${g.imageFile}` : await uploadImage(uid, g)) : null;
      const { error } = await supabase.from('garments').upsert(toRemoteGarment(uid, g, path));
      if (error) throw error;
    }
    for (const g of plan.pull) await putGarment(g);

    // pictures that are in the cloud but not on this phone yet (new device, or an earlier download failed)
    for (const g of await allGarments()) {
      if (g.deletedAt === null && g.uploaded && g.imageFile && !new File(garmentsDir(), g.imageFile).exists) {
        await downloadImage(uid, g);
        refresh();
      }
    }

    // outfits
    const { data: ro, error: eo } = await supabase.from('outfits').select('*');
    if (eo) throw eo;
    const plan2 = planSync(await allOutfits(), (ro ?? []).map(fromRemoteOutfit));
    if (plan2.push.length) {
      const { error } = await supabase.from('outfits').upsert(plan2.push.map((o) => toRemoteOutfit(uid, o)));
      if (error) throw error;
    }
    for (const o of plan2.pull) await putOutfit(o);

    setStatus({ state: 'idle', last: Date.now(), error: null });
  } catch (e: any) {
    // Offline, project paused, or a bad key all land here; local use is unaffected.
    setStatus({ ...status, state: 'error', error: e?.message ?? String(e) });
  }
}

/** Sync after sign-in, after the user's edits (debounced), and whenever the app returns to the foreground. */
export function startAutoSync() {
  if (!supabase) return () => {};
  let t: ReturnType<typeof setTimeout> | undefined;
  const later = () => {
    clearTimeout(t);
    t = setTimeout(() => void syncNow(), 3000);
  };
  const off = onLocalEdit(later);
  const app = AppState.addEventListener('change', (s) => {
    if (s === 'active') {
      supabase.auth.startAutoRefresh();
      void syncNow();
    } else supabase.auth.stopAutoRefresh();
  });
  const { data } = supabase.auth.onAuthStateChange((e) => e === 'SIGNED_IN' && void syncNow());
  void syncNow();
  return () => {
    off();
    app.remove();
    data.subscription.unsubscribe();
    clearTimeout(t);
  };
}
