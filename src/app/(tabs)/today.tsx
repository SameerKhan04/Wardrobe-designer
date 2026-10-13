import { router } from 'expo-router';
import * as Location from 'expo-location';
import Storage from 'expo-sqlite/kv-store';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { GarmentImage } from '@/components/GarmentImage';
import { suggestOutfits } from '@/core/suggest';
import type { Garment, Slots, Weather } from '@/core/types';
import { fetchWeather } from '@/core/weather';
import { newId, saveOutfit, useGarments } from '@/data/db';
import { setMixer } from '@/state/mixer';
import { C, serif } from '@/theme';
import { Button, Chip, Empty, Screen, Title } from '@/ui';

const KEY = 'lastWeather';
function lastWeather(): Weather {
  try {
    const w = JSON.parse(Storage.getItemSync(KEY) ?? '');
    if (typeof w.tempC === 'number') return { tempC: w.tempC, raining: !!w.raining };
  } catch {}
  return { tempC: 18, raining: false };
}

export default function Today() {
  const garments = useGarments();
  const [weather, setWeatherState] = useState<Weather>(lastWeather);
  const [seed, setSeed] = useState(0);
  const [locating, setLocating] = useState(false);

  const setWeather = (w: Weather) => {
    setWeatherState(w);
    Storage.setItemSync(KEY, JSON.stringify(w)); // stays on this device
    setSeed((n) => n + 1);
  };
  const step = (d: number) => setWeather({ ...weather, tempC: Math.max(-30, Math.min(50, weather.tempC + d)) });

  async function useMyLocation() {
    setLocating(true);
    try {
      // Foreground, one-shot, only because the user tapped. Never in the background.
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location is off', 'No problem. Set the temperature and rain yourself.');
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setWeather(await fetchWeather(coords.latitude, coords.longitude));
    } catch (e: any) {
      Alert.alert('Could not get the weather', `${e?.message ?? e}\n\nSet it yourself instead.`);
    } finally {
      setLocating(false);
    }
  }

  // Re-rolled only by a weather change, "Another round", or a closet change; not by unrelated re-renders.
  const outfits = useMemo(
    () => suggestOutfits(garments, weather, Math.random),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [garments, weather, seed],
  );

  return (
    <Screen>
      <Title sub="Dress for wherever you are going">Today</Title>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stepper label="Down 5 degrees" text="-5" onPress={() => step(-5)} />
            <Stepper label="Down 1 degree" text="-1" onPress={() => step(-1)} />
            <Text accessibilityLabel={`${weather.tempC} degrees Celsius`} style={{ fontFamily: serif, fontSize: 44, color: C.ink, minWidth: 110, textAlign: 'center' }}>
              {weather.tempC}°C
            </Text>
            <Stepper label="Up 1 degree" text="+1" onPress={() => step(1)} />
            <Stepper label="Up 5 degrees" text="+5" onPress={() => step(5)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
            <Chip label="No rain" on={!weather.raining} onPress={() => setWeather({ ...weather, raining: false })} />
            <Chip label="Rain" on={weather.raining} onPress={() => setWeather({ ...weather, raining: true })} />
          </View>
          <Button kind="ghost" label="Use where I am" icon="sun" busy={locating} onPress={useMyLocation} />
        </View>

        {!garments.length ? (
          <Empty title="Add a few pieces first" body="Suggestions come from clean clothes in your closet." />
        ) : !outfits.length ? (
          <Empty title="Nothing clean to suggest" body="Everything is in the laundry or at the dry cleaners." />
        ) : (
          outfits.map((o, i) => <Suggestion key={i} slots={o} garments={garments} />)
        )}
        {outfits.length > 0 && <Button kind="ghost" label="Another round" icon="refresh" onPress={() => setSeed((n) => n + 1)} />}
      </ScrollView>
    </Screen>
  );
}

function Stepper({ text, label, onPress }: { text: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? C.goldSoft : C.paper, borderWidth: 1, borderColor: C.line,
      })}>
      <Text style={{ color: C.ink, fontWeight: '700' }}>{text}</Text>
    </Pressable>
  );
}

function Suggestion({ slots, garments }: { slots: Slots; garments: Garment[] }) {
  const parts = [slots.top, slots.bottom, slots.shoes, slots.outerwear]
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Garment => !!g);
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line, padding: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {parts.map((g) => <GarmentImage key={g.id} garment={g} size={76} />)}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          kind="ghost"
          label="Save"
          icon="bookmark"
          style={{ flex: 1 }}
          onPress={() =>
            saveOutfit({
              id: newId(), name: null, tags: [], topId: slots.top, bottomId: slots.bottom, shoesId: slots.shoes,
              outerwearId: slots.outerwear, updatedAt: 0, deletedAt: null,
            })
          }
        />
        <Button
          label="Try in mixer"
          icon="shuffle"
          style={{ flex: 2 }}
          onPress={() => {
            setMixer({ slots, locked: [] });
            router.navigate('/');
          }}
        />
      </View>
    </View>
  );
}
