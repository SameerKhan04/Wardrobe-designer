import { Pressable, Switch, Text, View } from 'react-native';
import {
  AVAILABILITIES, CATEGORIES, FORMALITIES, WARMTHS, type Availability, type Category, type Formality, type Warmth,
} from '@/core/types';
import { C } from '@/theme';
import { cap, Chip, Section } from '@/ui';

export type Draft = {
  category: Category; color: string; formality: Formality; warmth: Warmth;
  rainproof: boolean; breathable: boolean; availability: Availability;
};

export const defaultDraft = (category: Category = 'top'): Draft => ({
  category, color: '', formality: 'casual', warmth: 'mid', rainproof: false, breathable: false, availability: 'clean',
});

const SWATCHES: [string, string][] = [
  ['black', '#1C1A16'], ['white', '#FAFAF5'], ['grey', '#9A9A96'], ['beige', '#D8C3A5'], ['brown', '#7A5230'],
  ['red', '#C0392B'], ['pink', '#E8A0B4'], ['orange', '#E67E22'], ['yellow', '#F1C40F'], ['green', '#4F8A5B'],
  ['blue', '#3C6EA8'], ['navy', '#1F2D4D'], ['purple', '#7B5EA7'],
];

/** Category is the only required choice. Everything else has a sensible default and can be left alone. */
export function GarmentForm({ value, onChange }: { value: Draft; onChange: (patch: Partial<Draft>) => void }) {
  return (
    <View style={{ gap: 20 }}>
      <Section label="Category">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c === 'dress' ? 'Dress' : c === 'outerwear' ? 'Jacket' : cap(c)} on={value.category === c} onPress={() => onChange({ category: c })} />
          ))}
        </View>
      </Section>

      <Section label="Colour (optional)">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {SWATCHES.map(([name, hex]) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={name}
              accessibilityState={{ selected: value.color === name }}
              onPress={() => onChange({ color: value.color === name ? '' : name })}
              style={{
                width: 34, height: 34, borderRadius: 17, backgroundColor: hex, borderWidth: 1, borderColor: C.line,
                ...(value.color === name ? { borderWidth: 3, borderColor: C.gold } : null),
              }}
            />
          ))}
        </View>
      </Section>

      <Section label="Dress code">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {FORMALITIES.map((f) => <Chip key={f} label={cap(f)} on={value.formality === f} onPress={() => onChange({ formality: f })} />)}
        </View>
      </Section>

      <Section label="Warmth">
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {WARMTHS.map((w) => <Chip key={w} label={cap(w)} on={value.warmth === w} onPress={() => onChange({ warmth: w })} />)}
        </View>
      </Section>

      <Section label="Fabric">
        <Row label="Rainproof" value={value.rainproof} onChange={(v) => onChange({ rainproof: v })} />
        <Row label="Breathable" value={value.breathable} onChange={(v) => onChange({ breathable: v })} />
      </Section>

      <Section label="Status">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AVAILABILITIES.map((a) => (
            <Chip key={a} label={a === 'clean' ? 'Clean' : a === 'laundry' ? 'In laundry' : 'Dry cleaners'} on={value.availability === a} onPress={() => onChange({ availability: a })} />
          ))}
        </View>
      </Section>
    </View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: C.ink, fontSize: 16 }}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.line, true: C.goldSoft }}
        thumbColor={value ? C.gold : '#fff'}
      />
    </View>
  );
}
