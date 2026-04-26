import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { FontSize, FontFamily, Spacing } from '../../src/constants/theme';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { useStore } from '../../src/store/useStore';
import { track, Events, setPersonProperties } from '../../src/services/analytics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';

const AGE_BANDS = [
  { id: 'under_18', label: 'Under 18' },
  { id: '18_24', label: '18–24' },
  { id: '25_34', label: '25–34' },
  { id: '35_44', label: '35–44' },
  { id: '45_plus', label: '45+' },
];

export default function AgeScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const { setAgeBand } = useStore();
  const { colors, isDark } = useThemeColors();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(AGE_BANDS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.stagger(
        80,
        itemAnims.map((anim) =>
          Animated.spring(anim, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true })
        )
      ).start();
    }, 150);
    setTimeout(() => {
      Animated.spring(buttonAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    }, 150 + AGE_BANDS.length * 80 + 100);
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    setAgeBand(selected);
    track(Events.AgeSelected, { ageBand: selected });
    setPersonProperties({ ageBand: selected });
    router.push('/onboarding/struggles');
  };

  const animStyle = (anim: Animated.Value, translateY = 32) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }),
      },
    ],
  });

  return (
    <OnboardingLayout>
      <OnboardingBackButton />

      <View style={styles.content}>
        <Animated.View style={[styles.headerSection, animStyle(headerAnim)]}>
          <Text style={[styles.title, { color: colors.text }]}>How old{'\n'}are you?</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Helps us tailor the experience.
          </Text>
        </Animated.View>

        <View style={styles.listSection}>
          {AGE_BANDS.map((item, index) => {
            const isSelected = selected === item.id;
            return (
              <Animated.View key={item.id} style={animStyle(itemAnims[index], 24)}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelected(item.id)}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: isSelected
                        ? (isDark ? colors.accentLight : 'rgba(245,166,35,0.06)')
                        : colors.card,
                      borderColor: isSelected ? colors.accentGlow : colors.accentLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: isSelected ? colors.text : colors.secondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View style={[styles.bottomContainer, animStyle(buttonAnim)]}>
          <OnboardingButton
            label={selected ? 'Continue' : 'Pick an age range'}
            onPress={handleContinue}
          />
        </Animated.View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  headerSection: {
    paddingHorizontal: 32,
    paddingTop: 140,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 48,
    alignItems: 'center',
  },
});
