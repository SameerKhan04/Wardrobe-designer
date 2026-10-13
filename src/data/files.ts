import { Directory, File, Paths } from 'expo-file-system';
import type { Garment } from '@/core/types';

export function garmentsDir() {
  const d = new Directory(Paths.document, 'garments');
  if (!d.exists) d.create({ intermediates: true });
  return d;
}

/** Copy a processed image into permanent storage and return the file name to remember. */
export function storeImage(srcUri: string, id: string): string {
  const name = `${id}.${srcUri.toLowerCase().endsWith('.png') ? 'png' : 'jpg'}`;
  const dest = new File(garmentsDir(), name);
  if (dest.exists) dest.delete();
  new File(srcUri).copy(dest);
  return name;
}

export function imageUri(g: Pick<Garment, 'imageFile'>): string | null {
  if (!g.imageFile) return null;
  const f = new File(garmentsDir(), g.imageFile);
  return f.exists ? f.uri : null;
}

export function removeAllImages() {
  const d = new Directory(Paths.document, 'garments');
  if (d.exists) d.delete();
}
