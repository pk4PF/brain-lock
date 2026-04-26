import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Animated, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CheckCircle2, Pause, Play } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import DifficultyPicker, { type Difficulty, DIFFICULTY_CREDITS } from '../../src/components/DifficultyPicker';

type Step = 'pick' | 'running' | 'done';

const MEDITATION_GRADIENT: [string, string, string] = ['#0F172A', '#1E293B', '#0F172A'];
const ACCENT = '#A78BFA';

const MINUTES: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MeditationScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const { earnReward, addPoints, canEarnToday, setShowPaywall } = useStore();

  const [step, setStep] = useState<Step>('pick');
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(MINUTES.easy * 60);
  const [remaining, setRemaining] = useState(MINUTES.easy * 60);
  const [paused, setPaused] = useState(false);
  const [earned, setEarned] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const breathAnim = useRef(new Animated.Value(0)).current;

  const start = (d: Difficulty) => {
    if (!canEarnToday()) {
      setShowPaywall(true);
      return;
    }
    const total = MINUTES[d] * 60;
    setDifficulty(d);
    setTotalSeconds(total);
    setRemaining(total);
    setPaused(false);
    setStep('running');
  };

  // Breathing loop (4s in, 4s hold, 4s out, 4s hold)
  useEffect(() => {
    if (step !== 'running') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(breathAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
        Animated.delay(2000),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [step]);

  // Countdown
  useEffect(() => {
    if (step !== 'running' || paused) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [step, paused]);

  // Complete
  useEffect(() => {
    if (step !== 'running' || remaining > 0) return;
    clearInterval(intervalRef.current);
    if (!difficulty) return;
    hapticMedium();
    const reward = DIFFICULTY_CREDITS[difficulty];
    earnReward(reward);
    addPoints(reward);
    setEarned(reward);
    setStep('done');
  }, [remaining, step, difficulty]);

  const goBack = () => {
    hapticLight();
    router.back();
  };

  const togglePause = () => {
    hapticLight();
    setPaused((p) => !p);
  };

  if (step === 'pick') {
    return (
      <DifficultyPicker
        gameTitle="Meditation"
        accentColor={ACCENT}
        gradient={MEDITATION_GRADIENT}
        onSelect={start}
      />
    );
  }

  if (step === 'done') {
    return (
      <LinearGradient colors={MEDITATION_GRADIENT} style={{ flex: 1, paddingTop: insets.top + 8 }}>
        <YStack flex={1} justifyContent="center" alignItems="center" paddingHorizontal={24}>
          <View
            width={120}
            height={120}
            borderRadius={60}
            backgroundColor={`${ACCENT}22`}
            justifyContent="center"
            alignItems="center"
            marginBottom={24}
          >
            <CheckCircle2 size={56} color={ACCENT} />
          </View>
          <Text color="#FFFFFF" fontSize={30} fontWeight="800" letterSpacing={-0.5} marginBottom={8}>
            Well done
          </Text>
          <Text color="rgba(255,255,255,0.6)" fontSize={16} marginBottom={32} textAlign="center">
            You earned{' '}
            <Text color={ACCENT} fontWeight="700">+{earned} credits</Text>
            {' '}· {earned} min screen time
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticLight();
              router.replace('/(tabs)');
            }}
            style={{ width: '100%' }}
          >
            <View
              height={54}
              borderRadius={16}
              backgroundColor={ACCENT}
              justifyContent="center"
              alignItems="center"
              {...Platform.select({
                ios: {
                  shadowColor: ACCENT,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 14,
                },
                android: { elevation: 5 },
                default: {},
              })}
            >
              <Text color="#FFFFFF" fontSize={16} fontWeight="700">
                Back to home
              </Text>
            </View>
          </TouchableOpacity>
        </YStack>
      </LinearGradient>
    );
  }

  // Running
  const progress = 1 - remaining / totalSeconds;
  const scale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });
  const opacity = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <LinearGradient colors={MEDITATION_GRADIENT} style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <View paddingHorizontal={20} paddingBottom={12}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7} style={{ paddingVertical: 8 }}>
          <XStack alignItems="center" gap={4}>
            <ChevronLeft size={22} color="rgba(255,255,255,0.7)" />
            <Text color="rgba(255,255,255,0.7)" fontSize={15} fontWeight="500">End session</Text>
          </XStack>
        </TouchableOpacity>
      </View>

      <YStack flex={1} justifyContent="center" alignItems="center" paddingHorizontal={24}>
        <Animated.View
          style={{
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: `${ACCENT}22`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 48,
            transform: [{ scale }],
            opacity,
          }}
        >
          <View
            width={180}
            height={180}
            borderRadius={90}
            backgroundColor={`${ACCENT}33`}
            justifyContent="center"
            alignItems="center"
          >
            <Text color="#FFFFFF" fontSize={44} fontWeight="800" letterSpacing={-1}>
              {format(remaining)}
            </Text>
          </View>
        </Animated.View>

        <Text color="rgba(255,255,255,0.75)" fontSize={17} fontWeight="600" marginBottom={8}>
          Breathe
        </Text>
        <Text color="rgba(255,255,255,0.45)" fontSize={14} textAlign="center" marginBottom={40} paddingHorizontal={20}>
          In through your nose · hold · out through your mouth
        </Text>

        {/* Progress bar */}
        <View
          width="100%"
          height={4}
          borderRadius={2}
          backgroundColor="rgba(255,255,255,0.08)"
          overflow="hidden"
          marginBottom={32}
        >
          <View
            height="100%"
            width={`${progress * 100}%`}
            backgroundColor={ACCENT}
            borderRadius={2}
          />
        </View>

        <TouchableOpacity onPress={togglePause} activeOpacity={0.8}>
          <View
            width={64}
            height={64}
            borderRadius={32}
            backgroundColor={`${ACCENT}22`}
            borderWidth={1}
            borderColor={`${ACCENT}55`}
            justifyContent="center"
            alignItems="center"
          >
            {paused ? (
              <Play size={24} color={ACCENT} fill={ACCENT} />
            ) : (
              <Pause size={24} color={ACCENT} fill={ACCENT} />
            )}
          </View>
        </TouchableOpacity>
      </YStack>
    </LinearGradient>
  );
}
