import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FontFamily } from '../constants/theme';

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
  { id: 'easy', label: 'Easy', sublabel: 'Warm up', credits: 5, dots: 1 },
  { id: 'medium', label: 'Medium', sublabel: 'Train hard', credits: 10, dots: 2 },
  { id: 'hard', label: 'Hard', sublabel: 'Grind', credits: 15, dots: 3 },
];

interface Props {
  gameTitle: string;
  accentColor: string;
  gradient: readonly [string, string, ...string[]];
  onSelect: (difficulty: Difficulty) => void;
}

export default function DifficultyPicker({ gameTitle, accentColor, gradient, onSelect }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const cardAnims = useRef(OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.stagger(80, cardAnims.map((a) =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
      )).start();
    }, 200);
  }, []);

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.gameTitle}>{gameTitle}</Text>
        <Text style={styles.prompt}>Choose your difficulty</Text>
      </Animated.View>

      <View style={styles.cards}>
        {OPTIONS.map((opt, i) => (
          <Animated.View
            key={opt.id}
            style={{
              flex: 1,
              opacity: cardAnims[i],
              transform: [{
                translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              }],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onSelect(opt.id)}
              style={styles.cardTouch}
            >
              <View style={[styles.card, { borderColor: `${accentColor}30` }]}>
                {/* Dots */}
                <View style={styles.dots}>
                  {Array.from({ length: 3 }, (_, k) => (
                    <View
                      key={k}
                      style={[
                        styles.dot,
                        { backgroundColor: k < opt.dots ? accentColor : `${accentColor}20` },
                      ]}
                    />
                  ))}
                </View>

                <Text style={styles.cardLabel}>{opt.label}</Text>
                <Text style={[styles.cardSub, { color: `rgba(255,255,255,0.5)` }]}>{opt.sublabel}</Text>

                <View style={[styles.creditBadge, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}>
                  <Text style={[styles.creditText, { color: accentColor }]}>+{opt.credits}</Text>
                  <Text style={[styles.creditLabel, { color: `${accentColor}99` }]}>credits</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
        Harder = more credits earned
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
  },
  backText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  gameTitle: {
    fontSize: 28,
    fontFamily: FontFamily.heavy,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  prompt: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  cards: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  cardTouch: {
    flex: 1,
    height: '100%',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardLabel: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  creditBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  creditText: {
    fontSize: 22,
    fontFamily: FontFamily.heavy,
    letterSpacing: -0.5,
  },
  creditLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 20,
  },
});
