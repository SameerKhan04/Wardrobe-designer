import { Platform } from 'react-native';

/** Warm paper stage, near-black ink, one gold accent reserved for Lock / Shuffle / the primary action. */
export const C = {
  paper: '#F5F0E6',
  card: '#FFFCF5',
  ink: '#1C1A16',
  mute: '#756F63',
  line: '#E2D9C8',
  gold: '#B8862B',
  goldSoft: '#F0E2BF',
  danger: '#B03A2E',
};

export const serif = Platform.select({ ios: 'Georgia', default: 'serif' });
