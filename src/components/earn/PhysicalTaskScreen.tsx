import { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Platform, Animated, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CheckCircle2, Zap } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, REPS_TO_REWARD, UNLOCK_CREDIT_COST, PhysicalTaskType } from '../../store/useStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../utils/haptics';
import { track, Events } from '../../services/analytics';

type Step = 'pick-reps' | 'in-progress' | 'done';

interface Props {
  task: PhysicalTaskType;
  title: string;
  description: string;
  gradient: [string, string];
  instructions: string[];
}

const REP_OPTIONS = [10, 20, 30];

const TASK_EMOJI: Record<PhysicalTaskType, string> = {
  pushups: '💪',
  squats: '🦵',
};

const TASK_MOTIVATION: Record<PhysicalTaskType, string[]> = {
  pushups: ['Build chest & shoulder strength', 'Earn credits with every rep', 'Takes less than 2 minutes'],
  squats: ['Build leg & core strength', 'Earn credits with every rep', 'Takes less than 2 minutes'],
};

export default function PhysicalTaskScreen({ task, title, description, gradient, instructions }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const { recordPhysicalTask, canEarnToday, setShowPaywall } = useStore();

  const [step, setStep] = useState<Step>('pick-reps');
  const [reps, setReps] = useState<number>(10);
  const [earnedCredits, setEarnedCredits] = useState<number>(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emojiAnim = useRef(new Animated.Value(0)).current;
  const startedEventFired = useRef(false);

  useEffect(() => {
    fadeAnim.setValue(0);
    emojiAnim.setValue(0.6);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(emojiAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handleStart = () => {
    hapticMedium();
    if (!canEarnToday()) {
      setShowPaywall(true);
      return;
    }
    if (!startedEventFired.current) {
      track(task === 'pushups' ? Events.PushupStarted : Events.SquatStarted, { reps });
      startedEventFired.current = true;
    }
    setStep('in-progress');
  };

  const handleComplete = () => {
    hapticMedium();
    const reward = REPS_TO_REWARD[reps] ?? Math.floor(reps / 2);
    recordPhysicalTask(task, reps);
    setEarnedCredits(reward);
    track(task === 'pushups' ? Events.PushupCompleted : Events.SquatCompleted, { reps, credits: reward });
    setStep('done');
  };

  const goBack = () => {
    hapticLight();
    router.back();
  };

  const emoji = TASK_EMOJI[task] ?? '💪';

  // ── PICK REPS ──────────────────────────────────────────────────────────────
  if (step === 'pick-reps') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          style={[styles.backBtn, { top: insets.top + 8 }]}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
          <Text color="rgba(255,255,255,0.9)" fontSize={15} fontWeight="500">Back</Text>
        </TouchableOpacity>

        {/* Hero section */}
        <YStack alignItems="center" justifyContent="center" style={{ paddingTop: insets.top + 64, paddingBottom: 32 }}>
          <Animated.Text style={[styles.heroEmoji, { transform: [{ scale: emojiAnim }] }]}>
            {emoji}
          </Animated.Text>
          <Text color="#FFFFFF" fontSize={34} fontWeight="800" letterSpacing={-0.8} textAlign="center" marginTop={12}>
            {title}
          </Text>
          <Text color="rgba(255,255,255,0.75)" fontSize={15} textAlign="center" marginTop={6} paddingHorizontal={32}>
            {description}
          </Text>

          {/* Benefit pills */}
          <XStack gap={8} marginTop={16} flexWrap="wrap" justifyContent="center" paddingHorizontal={24}>
            {TASK_MOTIVATION[task].map((b, i) => (
              <View key={i} backgroundColor="rgba(255,255,255,0.18)" borderRadius={20} paddingHorizontal={12} paddingVertical={5}>
                <Text color="#FFFFFF" fontSize={11} fontWeight="600">{b}</Text>
              </View>
            ))}
          </XStack>
        </YStack>

        {/* Bottom sheet */}
        <View
          flex={1}
          backgroundColor={colors.background}
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          paddingHorizontal={20}
          paddingTop={28}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          }}
        >
          <Text color={colors.text} fontSize={17} fontWeight="700" marginBottom={16}>
            Choose your reps
          </Text>

          <YStack gap={12} marginBottom={24}>
            {REP_OPTIONS.map((r) => {
              const reward = REPS_TO_REWARD[r];
              const active = reps === r;
              return (
                <TouchableOpacity
                  key={r}
                  activeOpacity={0.8}
                  onPress={() => { hapticLight(); setReps(r); }}
                >
                  <View
                    borderRadius={16}
                    borderWidth={2}
                    borderColor={active ? gradient[0] : colors.border}
                    backgroundColor={active ? `${gradient[0]}12` : colors.card}
                    paddingVertical={16}
                    paddingHorizontal={20}
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap={14}>
                        {/* Rep count badge */}
                        <View
                          width={52}
                          height={52}
                          borderRadius={14}
                          backgroundColor={active ? `${gradient[0]}20` : `${colors.muted}15`}
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Text color={active ? gradient[0] : colors.muted} fontSize={22} fontWeight="800">
                            {r}
                          </Text>
                        </View>
                        <YStack>
                          <Text color={colors.text} fontSize={18} fontWeight="700">
                            {r} reps
                          </Text>
                          <XStack alignItems="center" gap={4} marginTop={2}>
                            <Zap size={12} color={active ? gradient[0] : colors.muted} fill={active ? gradient[0] : 'transparent'} />
                            <Text color={active ? gradient[0] : colors.muted} fontSize={13} fontWeight="600">
                              +{reward} credits
                            </Text>
                          </XStack>
                        </YStack>
                      </XStack>
                      {active && <CheckCircle2 size={22} color={gradient[0]} />}
                    </XStack>
                  </View>
                </TouchableOpacity>
              );
            })}
          </YStack>

          <TouchableOpacity activeOpacity={0.85} onPress={handleStart}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 58,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                ...Platform.select({
                  ios: { shadowColor: gradient[0], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
                  android: { elevation: 6 },
                }),
              }}
            >
              <Text color="#FFFFFF" fontSize={17} fontWeight="700">
                Start {reps} {task} {emoji}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ── IN PROGRESS ────────────────────────────────────────────────────────────
  if (step === 'in-progress') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.4, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.7}
          style={[styles.backBtn, { top: insets.top + 8 }]}
        >
          <ChevronLeft size={22} color="#FFFFFF" />
          <Text color="rgba(255,255,255,0.9)" fontSize={15} fontWeight="500">Back</Text>
        </TouchableOpacity>

        <YStack alignItems="center" justifyContent="center" style={{ paddingTop: insets.top + 64, paddingBottom: 32 }}>
          <Animated.Text style={[styles.heroEmoji, { transform: [{ scale: emojiAnim }] }]}>
            {emoji}
          </Animated.Text>
          <View
            width={100}
            height={100}
            borderRadius={50}
            backgroundColor="rgba(255,255,255,0.2)"
            justifyContent="center"
            alignItems="center"
            marginTop={16}
          >
            <Text color="#FFFFFF" fontSize={48} fontWeight="900" letterSpacing={-2}>{reps}</Text>
          </View>
          <Text color="#FFFFFF" fontSize={26} fontWeight="800" marginTop={14} textAlign="center">
            Do {reps} {task}
          </Text>
          <Text color="rgba(255,255,255,0.75)" fontSize={15} textAlign="center" marginTop={6} paddingHorizontal={40}>
            Tap "Done" when you finish. Be honest — this is for you.
          </Text>
        </YStack>

        {/* Bottom sheet */}
        <View
          flex={1}
          backgroundColor={colors.background}
          borderTopLeftRadius={28}
          borderTopRightRadius={28}
          paddingHorizontal={20}
          paddingTop={28}
        >
          <Text color={colors.text} fontSize={15} fontWeight="700" marginBottom={12}>
            Form tips
          </Text>
          <YStack gap={10} marginBottom={28}>
            {instructions.map((ins, i) => (
              <XStack key={i} alignItems="flex-start" gap={10}>
                <View
                  width={24}
                  height={24}
                  borderRadius={12}
                  backgroundColor={`${gradient[0]}18`}
                  justifyContent="center"
                  alignItems="center"
                  marginTop={1}
                >
                  <Text color={gradient[0]} fontSize={12} fontWeight="800">{i + 1}</Text>
                </View>
                <Text color={colors.secondary} fontSize={14} lineHeight={20} flex={1}>{ins}</Text>
              </XStack>
            ))}
          </YStack>

          <TouchableOpacity activeOpacity={0.85} onPress={handleComplete}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 58,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                ...Platform.select({
                  ios: { shadowColor: gradient[0], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
                  android: { elevation: 6 },
                }),
              }}
            >
              <Text color="#FFFFFF" fontSize={17} fontWeight="700">
                Done — Earn +{REPS_TO_REWARD[reps]} credits
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  // ── DONE ───────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <YStack alignItems="center" justifyContent="center" style={{ paddingTop: insets.top + 80, paddingBottom: 36 }}>
        <Animated.Text style={[styles.heroEmoji, { transform: [{ scale: emojiAnim }] }]}>
          🏆
        </Animated.Text>
        <Text color="#FFFFFF" fontSize={36} fontWeight="900" letterSpacing={-1} marginTop={12} textAlign="center">
          Nice work!
        </Text>
        <View
          backgroundColor="rgba(255,255,255,0.18)"
          borderRadius={20}
          paddingHorizontal={20}
          paddingVertical={10}
          marginTop={14}
        >
          <XStack alignItems="center" gap={6}>
            <Zap size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text color="#FFFFFF" fontSize={18} fontWeight="700">
              +{earnedCredits} credits earned
            </Text>
          </XStack>
        </View>
      </YStack>

      <View
        flex={1}
        backgroundColor={colors.background}
        borderTopLeftRadius={28}
        borderTopRightRadius={28}
        paddingHorizontal={20}
        paddingTop={32}
      >
        <YStack gap={12}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              startedEventFired.current = false;
              setStep('pick-reps');
            }}
          >
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 58,
                borderRadius: 18,
                justifyContent: 'center',
                alignItems: 'center',
                ...Platform.select({
                  ios: { shadowColor: gradient[0], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
                  android: { elevation: 5 },
                }),
              }}
            >
              <Text color="#FFFFFF" fontSize={16} fontWeight="700">
                Do another set {emoji}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              router.replace('/(tabs)');
            }}
          >
            <View
              height={58}
              borderRadius={18}
              borderWidth={1.5}
              borderColor={colors.border}
              justifyContent="center"
              alignItems="center"
              backgroundColor={colors.card}
            >
              <Text color={colors.text} fontSize={16} fontWeight="600">
                Back to home
              </Text>
            </View>
          </TouchableOpacity>
        </YStack>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  heroEmoji: {
    fontSize: 80,
    lineHeight: 96,
  },
});
