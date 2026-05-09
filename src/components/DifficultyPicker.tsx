import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { FontFamily, Spacing } from '../constants/theme';
import { useThemeColors } from '../hooks/useThemeColors';
import { GameHeader } from './games/GameLayout';
import { hapticMedium } from '../utils/haptics';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_CREDITS: Record<Difficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

interface DifficultyOption {
  id: Difficulty;
  label: string;
  sublabel: string;
  credits: number;
  dots: number;
}

const OPTIONS: DifficultyOption[] = [
  { id: 'easy',   label: 'Easy',   sublabel: 'Warm up',    credits: 5,  dots: 1 },
  { id: 'medium', label: 'Medium', sublabel: 'Train hard', credits: 10, dots: 2 },
  { id: 'hard',   label: 'Hard',   sublabel: 'Grind',      credits: 15, dots: 3 },
];

interface Props {
  gameTitle: string;
  accentColor: string;
  onSelect: (difficulty: Difficulty) => void;
  onBack?: () => void;
}

export default function DifficultyPicker({ gameTitle, accentColor, onSelect, onBack }: Props) {
  const { colors } = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    Animated.stagger(70, cardAnims.map((a) =>
      Animated.spring(a, { toValue: 1, friction: 7, tension: 65, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader title={gameTitle} hue={accentColor} onClose={onBack ?? (() => router.back())} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 28 }}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>CHOOSE DIFFICULTY</Text>
          <Text style={[styles.heading, { color: colors.text }]}>How hard do you want to push?</Text>
        </View>

        <View style={{ gap: 12 }}>
          {OPTIONS.map((opt, i) => (
            <Animated.View
              key={opt.id}
              style={{
                opacity: cardAnims[i],
                transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              }}
            >
              <TouchableOpacity
                activeOpacity={0.78}
                onPress={() => { hapticMedium(); onSelect(opt.id); }}
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.dots}>
                    {Array.from({ length: 3 }, (_, k) => (
                      <View
                        key={k}
                        style={[
                          styles.dot,
                          { backgroundColor: k < opt.dots ? accentColor : `${accentColor}26` },
                        ]}
                      />
                    ))}
                  </View>
                  <View>
                    <Text style={[styles.cardLabel, { color: colors.text }]}>{opt.label}</Text>
                    <Text style={[styles.cardSub, { color: colors.muted }]}>{opt.sublabel}</Text>
                  </View>
                </View>

                <View style={[styles.creditBadge, { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33` }]}>
                  <Text style={[styles.creditText, { color: accentColor }]}>+{opt.credits}</Text>
                  <Text style={[styles.creditLabel, { color: accentColor }]}>cells</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>
          Harder = more brain cells per win.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  heading: {
    fontSize: 22,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  creditBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  creditText: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.4,
  },
  creditLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 22,
  },
});
