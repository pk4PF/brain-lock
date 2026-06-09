import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Shield, Gamepad2, BarChart3, User } from 'lucide-react-native';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight } from '../../src/utils/haptics';
import { useStore } from '../../src/store/useStore';
import PaywallModal from '../../src/components/PaywallModal';

function TabIcon({ icon: Icon, color, focused }: { icon: typeof Home; color: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      {focused && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: color + '25' },
          ]}
        />
      )}
      <Icon size={22} color={color} strokeWidth={2} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useThemeColors();
  const { showPaywall, setShowPaywall } = useStore();

  return (
    <>
    <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
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
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#4A4A5A' : '#B0A99F',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Geist_500Medium',
          letterSpacing: 0.2,
          marginTop: -2,
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
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} />,
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="lock"
        options={{
          title: 'Block',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Shield} color={color} focused={focused} />,
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Tests',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={Gamepad2} color={color} focused={focused} />,
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={BarChart3} color={color} focused={focused} />,
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon icon={User} color={color} focused={focused} />,
        }}
        listeners={{ tabPress: () => hapticLight() }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: 12,
  },
});
