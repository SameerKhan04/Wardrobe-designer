import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { GarmentForm, type Draft } from '@/components/GarmentForm';
import { GarmentImage } from '@/components/GarmentImage';
import { deleteGarment, saveGarment, useGarments } from '@/data/db';
import { C } from '@/theme';
import { Button, Empty, Screen } from '@/ui';

export default function EditGarment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const garment = useGarments().find((g) => g.id === id);
  const [patch, setPatch] = useState<Partial<Draft>>({});

  if (!garment) {
    return (
      <Screen>
        <Empty title="Not found" body="This piece is no longer in your closet." action={<Button label="Back" onPress={() => router.back()} />} />
      </Screen>
    );
  }
  const draft: Draft = { ...garment, ...patch };

  return (
    <Screen bottom>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
        <View style={{ backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.line, aspectRatio: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
          <GarmentImage garment={garment} size={260} />
        </View>
        <GarmentForm value={draft} onChange={(p) => setPatch({ ...patch, ...p })} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            kind="danger"
            label="Delete"
            icon="trash"
            style={{ flex: 1 }}
            onPress={() =>
              Alert.alert('Remove this piece?', 'It disappears from your closet and every device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => deleteGarment(garment).then(() => router.back()) },
              ])
            }
          />
          <Button
            label="Save"
            icon="check"
            style={{ flex: 2 }}
            onPress={async () => {
              await saveGarment({ ...garment, ...patch });
              router.back();
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
