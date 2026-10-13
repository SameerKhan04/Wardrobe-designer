import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { GarmentImage } from '@/components/GarmentImage';
import { CATEGORIES, type Category } from '@/core/types';
import { useGarments } from '@/data/db';
import { C } from '@/theme';
import { Button, cap, Chip, Empty, Screen, Title } from '@/ui';

const GAP = 12;
const COLS = 3;

export default function Closet() {
  const garments = useGarments();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - 32 - GAP * (COLS - 1)) / COLS);
  const shown = garments
    .filter((g) => filter === 'all' || g.category === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <Screen>
      <Title sub={`${garments.length} piece${garments.length === 1 ? '' : 's'}`}>Closet</Title>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
          <Chip small label="All" on={filter === 'all'} onPress={() => setFilter('all')} />
          {CATEGORIES.map((c) => (
            <Chip key={c} small label={c === 'outerwear' ? 'Jackets' : cap(c) + (c === 'dress' ? 'es' : 's')} on={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(g) => g.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 120 }}
        ListEmptyComponent={
          <Empty
            title={garments.length ? 'Nothing in this category' : 'Your closet is empty'}
            body={garments.length ? 'Try another filter, or add a piece.' : 'Lay a piece flat, take a photo, and it appears here.'}
          />
        }
        renderItem={({ item }) => {
          const away = item.availability !== 'clean';
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.color} ${item.category}${away ? ', not available' : ''}`}
              onPress={() => router.push(`/garment/${item.id}`)}
              style={{ width: cell, height: cell, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, padding: 8, opacity: away ? 0.45 : 1 }}>
              <GarmentImage garment={item} size={cell - 18} />
              {away && (
                <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: C.ink, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: C.paper, fontSize: 10, fontWeight: '700' }}>{item.availability === 'laundry' ? 'LAUNDRY' : 'DRY CLEAN'}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
      <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <Button label="Add" icon="plus" onPress={() => router.push('/add')} />
      </View>
    </Screen>
  );
}
