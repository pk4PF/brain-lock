import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Shield, BarChart3, User } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';

function TabIcon({ icon: Icon, color, focused }: { icon: typeof Home; color: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: color + '18' },
          ]}
        />
      )}
      <Icon size={21} color={color} strokeWidth={focused ? 2.2 : 1.8} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#0E0E15' : colors.card }]} />
          )
        ),
        tabBarStyle: {
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? '#0E0E15' : colors.card),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          elevation: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#4A4A5A' : '#B0A99F',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: -2,
        },
        tabBarItemStyle: {
          gap: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="lock"
        options={{
          title: 'Block',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Shield} color={color} focused={focused} />,
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
          tabBarIcon: ({ color, focused }) => <TabIcon icon={BarChart3} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={User} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    width: 36,
    height: 28,
    borderRadius: 10,
  },
});
