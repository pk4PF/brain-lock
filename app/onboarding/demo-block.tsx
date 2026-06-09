import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Lock, Check, ShieldCheck } from 'lucide-react-native';
import { ScreenTime } from 'screen-time-module';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { hapticLight, hapticSuccess } from '../../src/utils/haptics';
import OnboardingLayout from '../../src/components/onboarding/OnboardingLayout';
import OnboardingButton from '../../src/components/onboarding/OnboardingButton';
import OnboardingBackButton from '../../src/components/onboarding/OnboardingBackButton';
import FadeUp from '../../src/components/onboarding/FadeUp';
import { Eyebrow, SectionHeading, MutedText } from '../../src/components/ui/anvil';
import { useOnboardingStepView } from '../../src/hooks/useOnboardingStepView';

export default function DemoBlockScreen() {
  useOnboardingStepView('demo_block');
  const { colors } = useThemeColors();
  const { settings, updateSettings } = useStore();

  const [authStatus, setAuthStatus] = useState<'unknown' | 'approved' | 'denied' | 'unavailable'>('unknown');
  const [appCount, setAppCount] = useState(settings.screenTimeAppCount ?? 0);
  const [requesting, setRequesting] = useState(false);

  // Initial probe: are we authorized? Are we even on iOS with Family Controls?
  useEffect(() => {
    if (!ScreenTime.isAvailable) {
      setAuthStatus('unavailable');
      return;
    }
    (async () => {
      try {
        const status = await ScreenTime.getAuthorizationStatus();
        if (status === 'approved') {
          setAuthStatus('approved');
          updateSettings({ screenTimeAuthorized: true });
          const count = await ScreenTime.getSelectionCount();
          setAppCount(count);
          updateSettings({ screenTimeAppCount: count });
        }
      } catch {
        // Stay in 'unknown' until user taps the button
      }
    })();
  }, []);

  // Listen for app-picker selection changes
  useEffect(() => {
    const sub = ScreenTime.addSelectionChangeListener?.((event) => {
      const count = event.count ?? 0;
      setAppCount(count);
      updateSettings({ screenTimeAppCount: count });
      if (count > 0) hapticSuccess();
    });
    return () => sub?.remove?.();
  }, []);

  const handleAuthorize = async () => {
    if (!ScreenTime.isAvailable) {
      setAuthStatus('unavailable');
      return;
    }
    hapticLight();
    setRequesting(true);
    try {
      const result = await ScreenTime.requestAuthorization();
      const status = result.startsWith('denied') ? 'denied' : (result as any);
      setAuthStatus(status);
      updateSettings({ screenTimeAuthorized: status === 'approved' });
      if (status === 'approved') {
        // Open the picker right after approval
        try { await ScreenTime.showAppPicker(); } catch { /* user cancelled */ }
      } else if (status === 'denied') {
        Alert.alert(
          'Permission needed',
          'Brainlock needs Screen Time access to block apps. You can enable it in Settings → Screen Time.',
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not request Screen Time permission.');
    } finally {
      setRequesting(false);
    }
  };

  const handlePickApps = async () => {
    hapticLight();
    try {
      await ScreenTime.showAppPicker();
    } catch {
      // user cancelled
    }
  };

  const advance = () => {
    hapticLight();
    // Always-blocked model: if the user picked apps during onboarding,
    // engage the shield immediately so they're already protected.
    if (appCount > 0) {
      ScreenTime.blockApps().catch(() => { });
    }
    router.push('/onboarding/demo-game');
  };

  const isApproved = authStatus === 'approved';
  const hasApps = appCount > 0;
  const isUnavailable = authStatus === 'unavailable';

  return (
    <OnboardingLayout step={10} totalSteps={16}>
      <OnboardingBackButton />
      <View style={styles.content}>
        <View style={styles.top}>
          <FadeUp delay={0}>
            <Eyebrow>Step 1 - block</Eyebrow>
          </FadeUp>
          <FadeUp delay={80}>
            <SectionHeading size="lg">
              Block your distractions.
            </SectionHeading>
          </FadeUp>
          <View style={{ height: 10 }} />
          <FadeUp delay={160}>
            <MutedText size="md">
              Pick the apps you'll pass a challenge to open. You can always edit this later.
            </MutedText>
          </FadeUp>
        </View>

        <View style={styles.center}>
          {/* Status card - single hero indicator. Highlighted border when
              the user has selected apps; hairline otherwise. */}
          <FadeUp delay={260}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: hasApps ? colors.accent : colors.border,
                  borderWidth: hasApps ? 1.5 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: hasApps ? colors.accentLight : colors.cardAlt },
                ]}
              >
                {hasApps ? (
                  <Check size={20} color={colors.accent} strokeWidth={2.5} />
                ) : (
                  <Lock size={20} color={colors.muted} strokeWidth={1.8} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {hasApps ? `${appCount} app${appCount !== 1 ? 's' : ''} selected` : 'No apps selected yet'}
                </Text>
                <Text style={[styles.cardSub, { color: colors.muted }]}>
                  {hasApps ? 'Tap below to change your selection.' : 'You can always edit this later.'}
                </Text>
              </View>
            </View>
          </FadeUp>

          {/* Privacy disclosure. Apple's Family Controls hands the app
              opaque tokens, not bundle IDs, so we genuinely cannot see
              which apps were picked or what's done in them. Saying so
              up-front is the standard pattern (Opal, Jomo, ScreenZen). */}
          <FadeUp delay={340}>
            <View
              style={[
                styles.privacy,
                { backgroundColor: colors.cardAlt, borderColor: colors.border },
              ]}
            >
              <ShieldCheck size={16} color={colors.secondary} strokeWidth={1.8} />
              <Text style={[styles.privacyText, { color: colors.secondary }]}>
                Brainlock uses Apple Screen Time to set up the shield. We can't see
                which apps you pick, what's inside them, or your usage. That all stays
                on your device.
              </Text>
            </View>
          </FadeUp>
        </View>

        <View style={styles.bottomContainer}>
          {isUnavailable ? (
            <>
              <Text style={[styles.unavail, { color: colors.muted }]}>
                Screen Time is iOS-only. We'll set this up later.
              </Text>
              <OnboardingButton label="Continue" onPress={advance} />
            </>
          ) : !isApproved ? (
            <>
              {requesting ? (
                <View style={[styles.loadingBtn, { backgroundColor: colors.accent }]}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : (
                <OnboardingButton label="Enable & pick apps" onPress={handleAuthorize} />
              )}
              <TouchableOpacity activeOpacity={0.7} onPress={advance}>
                <Text style={[styles.skip, { color: colors.muted }]}>I'll do this later</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity activeOpacity={0.85} onPress={handlePickApps}>
                <View style={[styles.secondaryBtn, { borderColor: colors.accent }]}>
                  <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
                    {hasApps ? 'Edit selection' : 'Pick apps'}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ height: 10 }} />
              <OnboardingButton label="Continue" onPress={advance} />
              <TouchableOpacity activeOpacity={0.7} onPress={advance}>
                <Text style={[styles.skip, { color: colors.muted }]}>Maybe later</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between' },
  top: {
    paddingTop: 72,
    paddingHorizontal: Spacing.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    width: '100%',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    gap: 6,
  },
  loadingBtn: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
  },
  skip: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  unavail: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 12,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FontFamily.regular,
  },
});
