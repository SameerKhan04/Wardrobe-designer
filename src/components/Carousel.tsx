import { useEffect, useRef } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import type { Garment } from '@/core/types';
import { C, serif } from '@/theme';
import { Icon } from '@/ui';
import { GarmentImage } from './GarmentImage';

export const cellSize = (width: number) => Math.min(Math.round(width * 0.46), 190);

/**
 * One slot-machine row. Snaps item by item, centre item is the selection.
 * Only the visible window is mounted, and every cell is a fixed square, so scrolling stays smooth with a big closet.
 */
export function Carousel({
  label, items, selectedId, onSelect, locked, onToggleLock, emptyText,
}: {
  label: string; items: Garment[]; selectedId: string | null; onSelect: (id: string) => void;
  locked: boolean; onToggleLock: () => void; emptyText: string;
}) {
  const { width } = useWindowDimensions();
  const size = cellSize(width);
  const ref = useRef<FlatList<Garment>>(null);
  const mounted = useRef(false);
  const index = Math.max(0, items.findIndex((g) => g.id === selectedId));

  useEffect(() => {
    ref.current?.scrollToOffset({ offset: index * size, animated: mounted.current });
    mounted.current = true;
  }, [index, size, items.length]);

  return (
    <View accessibilityLabel={`${label} carousel`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
        <Text style={{ color: C.mute, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>{label}</Text>
        {items.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${locked ? 'Unlock' : 'Lock'} ${label}`}
            accessibilityState={{ selected: locked }}
            onPress={onToggleLock}
            hitSlop={8}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
              backgroundColor: locked ? C.gold : C.card, borderWidth: 1, borderColor: locked ? C.gold : C.line,
            }}>
            <Icon name={locked ? 'lock' : 'unlock'} size={16} color={C.ink} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.ink }}>{locked ? 'Locked' : 'Lock'}</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={{ height: size, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Text style={{ color: C.mute, textAlign: 'center', fontFamily: serif, fontSize: 16 }}>{emptyText}</Text>
        </View>
      ) : (
        <View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute', alignSelf: 'center', top: 4, bottom: 4, width: size - 6, borderRadius: 20,
              backgroundColor: C.card, borderWidth: locked ? 2 : 1, borderColor: locked ? C.gold : C.line,
            }}
          />
          <FlatList
            ref={ref}
            horizontal
            data={items}
            keyExtractor={(g) => g.id}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={index}
            snapToInterval={size}
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={{ paddingHorizontal: (width - size) / 2 }}
            getItemLayout={(_, i) => ({ length: size, offset: size * i, index: i })}
            initialNumToRender={5}
            windowSize={5}
            maxToRenderPerBatch={4}
            removeClippedSubviews
            renderItem={({ item }) => (
              <View style={{ width: size, height: size, padding: 14 }}>
                <GarmentImage garment={item} size={size - 28} />
              </View>
            )}
            onMomentumScrollEnd={(e) => {
              const g = items[Math.round(e.nativeEvent.contentOffset.x / size)];
              if (g && g.id !== selectedId) onSelect(g.id);
            }}
          />
        </View>
      )}
    </View>
  );
}
