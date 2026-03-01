import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Shield, BarChart3, User } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';

export default function TabLayout() {
  const { colors, isDark } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.accentLight,
          elevation: isDark ? 0 : 6,
          shadowColor: isDark ? 'transparent' : '#F5A623',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0 : 0.1,
          shadowRadius: 14,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          gap: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lock"
        options={{
          title: 'Block',
          tabBarIcon: ({ color }) => <Shield size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
