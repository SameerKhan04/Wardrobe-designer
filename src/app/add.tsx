import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Guide, Tip } from '@/components/Guide';
import { defaultDraft, GarmentForm, type Draft } from '@/components/GarmentForm';
import { CATEGORIES, type Category } from '@/core/types';
import { newId, saveGarment } from '@/data/db';
import { storeImage } from '@/data/files';
import { cutout, plainPhoto, squareFromPhoto } from '@/features/process';
import { C } from '@/theme';
import { Button, cap, Chip, Icon, Screen } from '@/ui';

type Result = { squareUri: string; uri: string; cut: boolean };

export default function Add() {
  const [perm, askPerm] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<Category>('top');
  const [draft, setDraft] = useState<Draft>(defaultDraft());
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function process(uri: string, w: number, h: number) {
    setBusy('Cutting it out…');
    try {
      const sq = await squareFromPhoto(uri, w, h);
      const cut = await cutout(sq);
      setDraft(defaultDraft(category));
      setResult({ squareUri: sq, uri: cut ?? (await plainPhoto(sq)), cut: !!cut });
    } catch (e: any) {
      Alert.alert('Could not read that photo', String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function shoot() {
    const photo = await camera.current?.takePictureAsync({ quality: 1 });
    if (photo) await process(photo.uri, photo.width, photo.height);
  }

  async function fromLibrary() {
    // Android's system photo picker: no storage permission needed. The crop step frames the square.
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (!r.canceled) await process(r.assets[0].uri, r.assets[0].width, r.assets[0].height);
  }

  async function retryCutout() {
    if (!result) return;
    setBusy('Cutting it out…');
    const cut = await cutout(result.squareUri);
    if (cut) setResult({ ...result, uri: cut, cut: true });
    else Alert.alert('Still no cutout', 'The photo is kept as it is. Try a plainer background if you want a cleaner edge.');
    setBusy(null);
  }

  async function save() {
    const id = newId();
    await saveGarment({ ...draft, id, imageFile: storeImage(result!.uri, id), uploaded: false, updatedAt: 0, deletedAt: null });
    router.back();
  }

  // ---------- review ----------
  if (result) {
    return (
      <Screen bottom>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}>
          <View style={{ backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.line, aspectRatio: 1, padding: 16 }}>
            <Image source={{ uri: result.uri }} style={{ flex: 1 }} contentFit="contain" accessibilityLabel="Your photo" />
          </View>
          {!result.cut && (
            <View style={{ backgroundColor: C.goldSoft, borderRadius: 14, padding: 14, gap: 10 }}>
              <Text style={{ color: C.ink }}>The cutout did not work this time, so the photo is kept as is. The first try can fail while the model downloads.</Text>
              <Button kind="ghost" label="Try cutout again" icon="refresh" busy={!!busy} onPress={retryCutout} />
            </View>
          )}
          <GarmentForm value={draft} onChange={(p) => setDraft({ ...draft, ...p })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button kind="ghost" label="Retake" onPress={() => setResult(null)} style={{ flex: 1 }} />
            <Button label="Save to closet" icon="check" onPress={save} style={{ flex: 2 }} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // ---------- capture ----------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={() => router.back()} style={{ padding: 8 }}>
          <Icon name="close" color="#fff" />
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Add a piece</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} small label={c === 'outerwear' ? 'Jacket' : cap(c)} on={category === c} onPress={() => setCategory(c)} />
        ))}
      </ScrollView>

      <View style={{ width, height: (width * 4) / 3, backgroundColor: '#111' }}>
        {perm?.granted ? (
          <>
            <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
            <Guide category={category} />
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>
              The camera shows a guide so each piece is framed the same way. You can also pick a photo instead.
            </Text>
            {perm?.canAskAgain !== false && <Button label="Allow camera" onPress={askPerm} />}
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 12, minHeight: 44, justifyContent: 'center' }}>
        <Tip />
      </View>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose from photos" onPress={fromLibrary} disabled={!!busy} style={s.side}>
          <Icon name="image" color="#fff" size={26} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          onPress={shoot}
          disabled={!perm?.granted || !!busy}
          style={({ pressed }) => [s.shutter, (!perm?.granted || !!busy) && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.94 }] }]}>
          <View style={s.shutterInner} />
        </Pressable>
        <View style={s.side} />
      </View>

      {busy && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
          <Text style={{ color: '#fff', fontSize: 18 }}>{busy}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  side: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.gold },
});
