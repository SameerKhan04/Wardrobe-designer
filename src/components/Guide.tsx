import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import type { Category } from '@/core/types';

/** Rough garment outlines in a 100x100 box. Enough to say "fill the frame like this". */
const SILHOUETTE: Record<Category, string> = {
  top: 'M30 15 L42 12 Q50 20 58 12 L70 15 L90 32 L80 43 L72 37 L72 88 L28 88 L28 37 L20 43 L10 32 Z',
  bottom: 'M26 8 L74 8 L78 92 L56 92 L50 36 L44 92 L22 92 Z',
  shoes: 'M12 58 Q12 42 26 40 L40 40 Q46 54 60 54 L84 58 Q92 60 92 68 L92 72 L12 72 Z',
  outerwear: 'M34 8 L50 16 L66 8 L92 30 L82 42 L74 36 L74 92 L26 92 L26 36 L18 42 L8 30 Z M50 16 L50 92',
  dress: 'M38 6 L46 6 L50 14 L54 6 L62 6 L60 36 L74 94 L26 94 L40 36 Z',
  accessory: 'M22 40 H78 V88 H22 Z M36 40 V28 Q50 12 64 28 V40',
};

const TIPS = [
  'Lay flat on a neutral, contrasting surface',
  'Even light. Avoid harsh shadows',
  'Smooth out wrinkles and fill the square',
];

/** Square capture frame on a 3:4 preview: rule-of-thirds grid, silhouette, dimmed outside area. */
export function Guide({ category }: { category: Category }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 300 400">
        <Rect x={0} y={0} width={300} height={50} fill="rgba(0,0,0,0.4)" />
        <Rect x={0} y={350} width={300} height={50} fill="rgba(0,0,0,0.4)" />
        {[100, 200].map((x) => <Line key={x} x1={x} y1={50} x2={x} y2={350} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />)}
        {[150, 250].map((y) => <Line key={y} x1={0} y1={y} x2={300} y2={y} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />)}
        <G transform="translate(30 80) scale(2.4)">
          <Path d={SILHOUETTE[category]} stroke="rgba(255,255,255,0.9)" strokeWidth={1} strokeDasharray="3 2" fill="rgba(255,255,255,0.08)" strokeLinejoin="round" />
        </G>
        <Rect x={1} y={51} width={298} height={298} stroke="rgba(255,255,255,0.8)" strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}

/** Cycles through the capture tips so each one gets read. */
export function Tip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % TIPS.length), 3500);
    return () => clearInterval(t);
  }, []);
  return <Text style={{ color: '#fff', fontSize: 15, textAlign: 'center' }}>{TIPS[i]}</Text>;
}
