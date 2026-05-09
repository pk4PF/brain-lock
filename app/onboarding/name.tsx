import { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';
import { track, Events } from '../../src/services/analytics';

export default function NameScreen() {
  useOnboardingStepView('name');
  const { colors } = useThemeColors();
  const { userName, setUserName } = useStore();
  const [name, setName] = useState(userName ?? '');
  const isFilled = name.trim().length > 0;

  const advance = () => {
    const trimmed = name.trim();
    setUserName(trimmed);
    track(Events.NameEntered, { name_length: trimmed.length });
    router.push('/onboarding/age');
  };

  return (
    <OnboardingLayout step={1}>
      {/* No back button - this is the entry screen of the onboarding. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ScrollView wrap + flexGrow:1 keeps "space-between" layout for normal
            sizes and lets users with iOS Display Zoom or larger Dynamic Type
            scroll to reach the Continue button when the layout overflows. */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.top}>
            <FadeUp delay={0}>
              <Eyebrow>First, you</Eyebrow>
            </FadeUp>
            <FadeUp delay={80}>
              <SectionHeading size="lg">
                What should we call you?
              </SectionHeading>
            </FadeUp>
            <View style={{ height: 10 }} />
            <FadeUp delay={160}>
              <MutedText size="md">
                You can change it later in your profile.
              </MutedText>
            </FadeUp>
          </View>

          <View style={styles.center}>
            <FadeUp delay={260}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: isFilled ? colors.accent : colors.border,
                  },
                ]}
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => isFilled && advance()}
                maxLength={24}
              />
            </FadeUp>
          </View>

          <FadeUp delay={400} travel={20}>
            <View style={styles.bottomContainer}>
              <OnboardingButton
                label="Continue"
                onPress={advance}
                disabled={!isFilled}
              />
            </View>
          </FadeUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  // flexGrow (not flex) inside a ScrollView contentContainerStyle so the
  // children still occupy the full screen when content fits, but can grow
  // taller (and scroll) when accessibility settings push them past viewport.
  content: { flexGrow: 1, justifyContent: 'space-between' },
  top: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  // Tall input, weight 500 (medium) - DESIGN.md restraint, no SemiBold.
  input: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    fontSize: 20,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
  },
});
