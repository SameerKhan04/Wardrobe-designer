import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { startAutoSync } from '@/data/cloud';
import { C } from '@/theme';

export default function Root() {
  useEffect(() => startAutoSync(), []);
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="garment/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
