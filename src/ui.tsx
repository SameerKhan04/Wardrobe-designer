import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSyncStatus } from './data/cloud';
import { C, serif } from './theme';

const PATHS = {
  lock: ['M8 11V8a4 4 0 0 1 8 0v3'],
  unlock: ['M8 11V8a4 4 0 0 1 7.6-1.7'],
  shuffle: ['M3 7h4l10 10h4', 'M3 17h4l2.5-2.5', 'M14 9.5 17 7h4', 'M18 4l3 3-3 3', 'M18 14l3 3-3 3'],
  plus: ['M12 5v14M5 12h14'],
  close: ['M6 6l12 12M18 6 6 18'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  trash: ['M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'],
  bookmark: ['M6 3.5h12v17l-6-4-6 4z'],
  grid: ['M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  sun: ['M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1'],
  user: ['M5 20a7 7 0 0 1 14 0'],
  image: ['M4 17l5-5 4 4 3-3 4 4'],
  refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4.5V11h-6.5'],
  minus: ['M5 12h14'],
} as const;
export type IconName = keyof typeof PATHS | 'camera';

export function Icon({ name, size = 22, color = C.ink }: { name: IconName; size?: number; color?: ColorValue }) {
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(name === 'lock' || name === 'unlock') && <Rect x={5} y={11} width={14} height={9} rx={2} {...stroke} />}
      {name === 'camera' && (
        <>
          <Path d="M4 8h3l1.5-2h7L17 8h3v11H4z" {...stroke} />
          <Circle cx={12} cy={13} r={3.5} {...stroke} />
        </>
      )}
      {name === 'sun' && <Circle cx={12} cy={12} r={4} {...stroke} />}
      {name === 'user' && <Circle cx={12} cy={8} r={4} {...stroke} />}
      {name === 'image' && (
        <>
          <Rect x={3.5} y={4.5} width={17} height={15} rx={2} {...stroke} />
          <Circle cx={9} cy={9.5} r={1.5} {...stroke} />
        </>
      )}
      {name !== 'camera' && PATHS[name].map((d) => <Path key={d} d={d} {...stroke} />)}
    </Svg>
  );
}

export function Screen({ children, bottom = false }: { children: ReactNode; bottom?: boolean }) {
  const insets = useSafeAreaInsets();
  const sync = useSyncStatus();
  return (
    <View style={{ flex: 1, backgroundColor: C.paper, paddingTop: insets.top, paddingBottom: bottom ? insets.bottom : 0 }}>
      {sync.state === 'error' && (
        <View accessibilityRole="alert" style={{ backgroundColor: C.ink, paddingVertical: 6, paddingHorizontal: 16 }}>
          <Text style={{ color: C.paper, fontSize: 13, textAlign: 'center' }}>Offline. Changes sync when you are back online.</Text>
        </View>
      )}
      {children}
    </View>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
      <Text accessibilityRole="header" style={{ fontFamily: serif, fontSize: 30, color: C.ink, letterSpacing: -0.5 }}>
        {children}
      </Text>
      {sub ? <Text style={{ color: C.mute, fontSize: 14, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export function Button({
  label, onPress, icon, kind = 'primary', busy, disabled, style,
}: {
  label: string; onPress: () => void; icon?: IconName; kind?: 'primary' | 'ghost' | 'danger';
  busy?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const fg = kind === 'primary' ? C.ink : kind === 'danger' ? C.danger : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        kind === 'primary' && { backgroundColor: C.gold },
        kind !== 'primary' && { borderWidth: 1, borderColor: kind === 'danger' ? C.danger : C.line, backgroundColor: C.card },
        (disabled || busy) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}>
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress?: () => void; small?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[s.chip, small && { paddingVertical: 8, paddingHorizontal: 14 }, on && { backgroundColor: C.ink, borderColor: C.ink }]}>
      <Text style={{ color: on ? C.paper : C.ink, fontSize: small ? 13 : 14, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

export function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: C.mute, fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      {children}
    </View>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      <Text style={{ fontFamily: serif, fontSize: 22, color: C.ink, textAlign: 'center' }}>{title}</Text>
      <Text style={{ color: C.mute, textAlign: 'center', fontSize: 15, lineHeight: 21 }}>{body}</Text>
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  );
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

const s = StyleSheet.create({
  btn: {
    minHeight: 50, borderRadius: 25, paddingHorizontal: 22, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
});
