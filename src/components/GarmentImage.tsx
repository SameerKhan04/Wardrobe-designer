import { Image } from 'expo-image';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Garment } from '@/core/types';
import { imageUri } from '@/data/files';
import { C, serif } from '@/theme';

/**
 * Always a fixed square with `contain`: a garment is never stretched, whatever its aspect ratio.
 * Decoded at display size by expo-image and cached on disk, so carousels stay light.
 */
export function GarmentImage({ garment, size, style }: { garment: Garment; size: number; style?: StyleProp<ViewStyle> }) {
  const uri = imageUri(garment);
  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="contain"
          recyclingKey={garment.id}
          cachePolicy="memory-disk"
          transition={120}
          accessibilityLabel={`${garment.color} ${garment.category}`.trim()}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.goldSoft, borderRadius: 12 }}>
          <Text style={{ fontFamily: serif, color: C.mute, fontSize: size * 0.18 }}>{garment.category}</Text>
        </View>
      )}
    </View>
  );
}
