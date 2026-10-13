import { removeBackground } from '@six33/react-native-bg-removal';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { centerSquare } from '@/core/crop';

const MAX = 800;

/** Centre square of the photo (what the framing guide shows), at 1024px. */
export async function squareFromPhoto(uri: string, width: number, height: number): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri).crop(centerSquare(width, height));
  if (Math.min(width, height) > 1024) ctx.resize({ width: 1024 });
  const img = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return img.uri;
}

async function fitLongest(uri: string, format: SaveFormat): Promise<string> {
  const { width, height } = await ImageManipulator.manipulate(uri).renderAsync();
  const ctx = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX) ctx.resize(width >= height ? { width: MAX } : { height: MAX });
  return (await (await ctx.renderAsync()).saveAsync({ format, compress: 0.9 })).uri;
}

/**
 * On-device cutout (ML Kit on Android). Returns a trimmed transparent PNG, or null when it fails,
 * e.g. the model is still downloading on first use, or nothing was found. Callers keep the photo instead.
 * Edges can be rough; that is accepted.
 */
export async function cutout(squareUri: string): Promise<string | null> {
  try {
    const cut = await removeBackground(squareUri, { trim: true });
    const { width, height } = await ImageManipulator.manipulate(cut).renderAsync();
    if (Math.min(width, height) < 32) return null; // library returns 1x1 when it finds no subject
    return await fitLongest(cut, SaveFormat.PNG);
  } catch {
    return null;
  }
}

/** The no-cutout fallback: the squared photo at storage size. */
export const plainPhoto = (squareUri: string) => fitLongest(squareUri, SaveFormat.JPEG);
