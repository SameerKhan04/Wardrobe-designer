export type Category = 'top' | 'bottom' | 'shoes' | 'outerwear' | 'dress' | 'accessory';
export type Formality = 'casual' | 'smart' | 'formal';
export type Warmth = 'light' | 'mid' | 'heavy';
export type Availability = 'clean' | 'laundry' | 'dry_cleaners';

export const CATEGORIES: Category[] = ['top', 'bottom', 'shoes', 'outerwear', 'dress', 'accessory'];
export const FORMALITIES: Formality[] = ['casual', 'smart', 'formal'];
export const WARMTHS: Warmth[] = ['light', 'mid', 'heavy'];
export const AVAILABILITIES: Availability[] = ['clean', 'laundry', 'dry_cleaners'];
export const OUTFIT_TAGS = ['Work', 'Casual', 'Date Night', 'Gym'] as const;

export interface Garment {
  id: string;
  category: Category;
  color: string;
  formality: Formality;
  warmth: Warmth;
  rainproof: boolean;
  breathable: boolean;
  availability: Availability;
  /** File name (not a path: iOS container paths change) of the 800px image in the garments dir; null until downloaded here. */
  imageFile: string | null;
  /** True once the image exists in cloud storage at `{userId}/{imageFile}`. */
  uploaded: boolean;
  /** Epoch ms of the last edit. Last write wins on sync. */
  updatedAt: number;
  /** Soft delete, so the deletion can sync. */
  deletedAt: number | null;
}

/** Top may hold a dress; a dress replaces the bottom row. */
export type SlotKey = 'top' | 'bottom' | 'shoes' | 'outerwear';
export const SLOT_KEYS: SlotKey[] = ['top', 'bottom', 'shoes', 'outerwear'];
export type Slots = Record<SlotKey, string | null>;

export interface Outfit {
  id: string;
  name: string | null;
  tags: string[];
  topId: string | null;
  bottomId: string | null;
  shoesId: string | null;
  outerwearId: string | null;
  updatedAt: number;
  deletedAt: number | null;
}

export interface Weather {
  tempC: number;
  raining: boolean;
}
