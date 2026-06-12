import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Plus, Check } from 'lucide-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import ChipGroup, { ChipOption } from '../../src/components/onboarding/ChipGroup';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { hapticLight } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';

const OPTIONS: ChipOption[] = [
  { value: 'read',     label: 'Read more' },
  { value: 'sleep',    label: 'Sleep better' },
  { value: 'workout',  label: 'Work out' },
  { value: 'present',  label: 'Be more present' },
  { value: 'learn',    label: 'Learn something' },
  { value: 'family',   label: 'Time with family' },
  { value: 'work',     label: 'Focus on work' },
  { value: 'creative', label: 'Be creative' },
];

// We mark a custom answer with this prefix so the rest of the app can tell
// "the user typed it themselves" from "they picked a chip". The UI just
// reads the post-prefix text.
const CUSTOM_PREFIX = 'custom:';

export default function GoalScreen() {
  useOnboardingStepView('goal');
  const { colors } = useThemeColors();
  const { userGoals, setUserGoals } = useStore();

  // Split persisted goals: chip values vs the single user-typed answer.
  const initialChips = (userGoals ?? []).filter((g) => !g.startsWith(CUSTOM_PREFIX));
  const initialCustom = (userGoals ?? []).find((g) => g.startsWith(CUSTOM_PREFIX))?.slice(CUSTOM_PREFIX.length) ?? '';

  const [selected, setSelected] = useState<string[]>(initialChips);
  const [customOpen, setCustomOpen] = useState<boolean>(initialCustom.length > 0);
  const [customText, setCustomText] = useState<string>(initialCustom);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (customOpen) {
      // Wait a beat for layout, then focus.
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [customOpen]);

  const advance = () => {
    const trimmed = customText.trim();
    const final = trimmed.length > 0
      ? [...selected, `${CUSTOM_PREFIX}${trimmed}`]
      : selected;
    setUserGoals(final);
    track(Events.GoalSelected, {
      goals: selected,
      has_custom: trimmed.length > 0,
      total_count: final.length,
    });
    router.push('/onboarding/demo-block');
  };

  const totalCount = selected.length + (customText.trim().length > 0 ? 1 : 0);

  return (
    <OnboardingLayout step={8} totalSteps={15}>
      <OnboardingBackButton />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FadeUp delay={0}>
              <Eyebrow>Your why</Eyebrow>
            </FadeUp>
            <FadeUp delay={80}>
              <SectionHeading size="lg">
                What will you do with your time back?
              </SectionHeading>
            </FadeUp>
            <View style={{ height: 10 }} />
            <FadeUp delay={160}>
              <MutedText size="md">
                Pick what matters. Or write your own.
              </MutedText>
            </FadeUp>

            <FadeUp delay={260}>
              <View style={{ marginTop: Spacing.xl }}>
                <ChipGroup options={OPTIONS} selected={selected} onChange={setSelected} />

                {/* Custom answer slot. Mounts as a small "+ Other" chip; opens
                    into an inline text input on tap. Mirrors the chip style so
                    the layout doesn't jump. */}
                <View style={{ marginTop: 14, alignItems: 'center' }}>
                  {!customOpen ? (
                    <CustomChipBtn onPress={() => { hapticLight(); setCustomOpen(true); }} />
                  ) : (
                    <View
                      style={[
                        styles.customCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: customText.trim().length > 0 ? colors.accent : colors.border,
                          borderWidth: customText.trim().length > 0 ? 1.5 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.customLabel, { color: colors.muted }]}>
                        IN YOUR OWN WORDS
                      </Text>
                      <TextInput
                        ref={inputRef}
                        value={customText}
                        onChangeText={setCustomText}
                        placeholder="e.g. Spend more time outside"
                        placeholderTextColor={colors.muted}
                        style={[styles.customInput, { color: colors.text }]}
                        maxLength={60}
                        returnKeyType="done"
                      />
                      {customText.trim().length > 0 && (
                        <View style={[styles.customTick, { backgroundColor: colors.accent }]}>
                          <Check size={11} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </FadeUp>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <OnboardingButton
              label={totalCount > 0 ? `Continue (${totalCount})` : 'Continue'}
              onPress={advance}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
}

function CustomChipBtn({ onPress }: { onPress: () => void }) {
  const { colors } = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, friction: 6, tension: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start()}
    >
      <Animated.View
        style={[
          styles.otherChip,
          { borderColor: colors.border, backgroundColor: 'transparent', transform: [{ scale }] },
        ]}
      >
        <Plus size={14} color={colors.muted} strokeWidth={2.4} />
        <Text style={[styles.otherChipText, { color: colors.muted }]}>Other</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scrollContent: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 16,
  },

  otherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  otherChipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },

  customCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    position: 'relative',
  },
  customLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  customInput: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.2,
    paddingVertical: 8,
    paddingRight: 28,
  },
  customTick: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    paddingTop: 12,
  },
});
