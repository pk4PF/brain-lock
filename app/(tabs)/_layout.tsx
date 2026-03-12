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
          backgroundColor: isDark ? '#0E0E15' : colors.card,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,213,79,0.06)' : 'rgba(0,0,0,0.04)',
          elevation: isDark ? 0 : 4,
          shadowColor: isDark ? colors.accent : '#8B7355',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.05 : 0.06,
          shadowRadius: isDark ? 16 : 10,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#4A4A5A' : colors.muted,
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
