import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, ScrollView, Text, View } from 'react-native';
import { GarmentImage } from '@/components/GarmentImage';
import { OUTFIT_TAGS, type Garment } from '@/core/types';
import { deleteOutfit, useGarments, useOutfits } from '@/data/db';
import { setMixer } from '@/state/mixer';
import { C } from '@/theme';
import { Button, Chip, Empty, Screen, Title } from '@/ui';

export default function Looks() {
  const outfits = useOutfits();
  const garments = useGarments();
  const [tag, setTag] = useState<string | null>(null);
  const shown = outfits.filter((o) => !tag || o.tags.includes(tag));

  return (
    <Screen>
      <Title sub={`${outfits.length} saved`}>Looks</Title>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
          <Chip small label="All" on={!tag} onPress={() => setTag(null)} />
          {OUTFIT_TAGS.map((t) => <Chip key={t} small label={t} on={tag === t} onPress={() => setTag(t)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<Empty title="No looks yet" body="Build an outfit in Mix and tap Save to keep it here." />}
        renderItem={({ item: o }) => {
          const parts = [o.topId, o.bottomId, o.shoesId, o.outerwearId]
            .map((id) => garments.find((g) => g.id === id))
            .filter((g): g is Garment => !!g);
          return (
            <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {parts.map((g) => <GarmentImage key={g.id} garment={g} size={72} />)}
              </View>
              {o.tags.length > 0 && <Text style={{ color: C.mute, fontSize: 13 }}>{o.tags.join('  ·  ')}</Text>}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  kind="ghost"
                  label="Delete"
                  icon="trash"
                  style={{ flex: 1 }}
                  onPress={() =>
                    Alert.alert('Delete this look?', undefined, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteOutfit(o) },
                    ])
                  }
                />
                <Button
                  label="Wear it"
                  icon="shuffle"
                  style={{ flex: 2 }}
                  onPress={() => {
                    setMixer({ slots: { top: o.topId, bottom: o.bottomId, shoes: o.shoesId, outerwear: o.outerwearId }, locked: [] });
                    router.navigate('/');
                  }}
                />
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
