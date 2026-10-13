import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { C } from '@/theme';
import { Icon, type IconName } from '@/ui';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color }: { color: ColorValue }) => <Icon name={icon} color={color} size={24} />,
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.mute,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={tab('Mix', 'shuffle')} />
      <Tabs.Screen name="closet" options={tab('Closet', 'grid')} />
      <Tabs.Screen name="today" options={tab('Today', 'sun')} />
      <Tabs.Screen name="looks" options={tab('Looks', 'bookmark')} />
      <Tabs.Screen name="you" options={tab('You', 'user')} />
    </Tabs>
  );
}
