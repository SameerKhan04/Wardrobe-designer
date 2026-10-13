import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Carousel } from '@/components/Carousel';
import { poolFor, repair, shuffle, toggleOuterwear } from '@/core/mixer';
import { OUTFIT_TAGS, type SlotKey } from '@/core/types';
import { newId, saveOutfit, useGarments } from '@/data/db';
import { setMixer, useMixer } from '@/state/mixer';
import { C } from '@/theme';
import { Button, Chip, Empty, Screen, Title } from '@/ui';

export default function Mixer() {
  const garments = useGarments();
  const { slots, locked } = useMixer();
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Keep every row valid as the closet changes (new item, laundry, delete). No-op when nothing is stale.
  useEffect(() => {
    const next = repair(slots, locked, garments);
    if (next !== slots) setMixer({ slots: next });
  }, [garments, slots, locked]);

  const isDress = garments.find((g) => g.id === slots.top)?.category === 'dress';
  const toggleLock = (k: SlotKey) => setMixer({ locked: locked.includes(k) ? locked.filter((x) => x !== k) : [...locked, k] });
  const select = (k: SlotKey, id: string) => {
    const dress = garments.find((g) => g.id === id)?.category === 'dress';
    setMixer({ slots: { ...slots, [k]: id, ...(k === 'top' && dress ? { bottom: null } : null) } });
  };

  async function save() {
    await saveOutfit({
      id: newId(), name: null, tags, topId: slots.top, bottomId: isDress ? null : slots.bottom,
      shoesId: slots.shoes, outerwearId: slots.outerwear, updatedAt: 0, deletedAt: null,
    });
    setSaving(false);
    setTags([]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!garments.length) {
    return (
      <Screen>
        <Title sub="Your closet, as a slot machine">Wardrobe</Title>
        <Empty
          title="Nothing here yet"
          body="Photograph a few pieces on a flat surface and they show up here, ready to mix."
          action={<Button label="Add your first piece" icon="camera" onPress={() => router.push('/add')} />}
        />
      </Screen>
    );
  }

  const rows: { key: SlotKey; label: string; empty: string }[] = [
    { key: 'top', label: 'Tops', empty: 'No clean tops. Add one, or check the laundry.' },
    ...(isDress ? [] : [{ key: 'bottom' as const, label: 'Bottoms', empty: 'No clean bottoms. Add one, or check the laundry.' }]),
    { key: 'shoes', label: 'Shoes', empty: 'No clean shoes. Add a pair, or check the laundry.' },
  ];

  return (
    <Screen>
      <Title sub="Lock what you love, shuffle the rest">Wardrobe</Title>
      <ScrollView contentContainerStyle={{ paddingBottom: 150, gap: 6 }} showsVerticalScrollIndicator={false}>
        {rows.map((r) => (
          <Animated.View key={r.key} layout={LinearTransition} entering={FadeIn} exiting={FadeOut}>
            <Carousel
              label={r.label}
              items={poolFor(r.key, garments)}
              selectedId={slots[r.key]}
              onSelect={(id) => select(r.key, id)}
              locked={locked.includes(r.key)}
              onToggleLock={() => toggleLock(r.key)}
              emptyText={r.empty}
            />
          </Animated.View>
        ))}
        {isDress && (
          <Animated.View layout={LinearTransition} entering={FadeIn} exiting={FadeOut}>
            <Text style={{ textAlign: 'center', color: C.mute, paddingVertical: 8 }}>A dress covers the bottoms row.</Text>
          </Animated.View>
        )}

        <Animated.View layout={LinearTransition} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 }}>
            <Text style={{ color: C.mute, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>Jacket (optional)</Text>
            <Chip small label={slots.outerwear ? 'On' : 'None'} on={!!slots.outerwear} onPress={() => setMixer({ slots: toggleOuterwear(slots, garments) })} />
          </View>
          {slots.outerwear ? (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Carousel
                label="Jackets"
                items={poolFor('outerwear', garments)}
                selectedId={slots.outerwear}
                onSelect={(id) => select('outerwear', id)}
                locked={locked.includes('outerwear')}
                onToggleLock={() => toggleLock('outerwear')}
                emptyText="No clean jackets."
              />
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 12, backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line }}>
        {saving && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {OUTFIT_TAGS.map((t) => (
              <Chip key={t} small label={t} on={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
            ))}
          </View>
        )}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {saving ? (
            <>
              <Button kind="ghost" label="Cancel" onPress={() => setSaving(false)} style={{ flex: 1 }} />
              <Button label="Save look" icon="bookmark" onPress={save} style={{ flex: 2 }} />
            </>
          ) : (
            <>
              <Button kind="ghost" label={saved ? 'Saved' : 'Save'} icon={saved ? 'check' : 'bookmark'} onPress={() => setSaving(true)} style={{ flex: 1 }} />
              <Button label="Shuffle" icon="shuffle" onPress={() => setMixer({ slots: shuffle(slots, locked, garments) })} style={{ flex: 2 }} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
