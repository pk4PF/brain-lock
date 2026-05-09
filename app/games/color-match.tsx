import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Palette } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { ColorRecallIll } from '../../src/components/games/GameIllustrations';

const HUE = GameAccents['color-match'].hue;
const TOTAL_ROUNDS = 20;
const ROUND_MS = 4000;  // auto-skip if user freezes

type Phase = 'intro' | 'playing' | 'result';

interface ColorOption {
  name: string;
  hex: string;
}

const COLORS_LIST: ColorOption[] = [
  { name: 'RED',    hex: '#EF4444' },
  { name: 'BLUE',   hex: '#3B82F6' },
  { name: 'GREEN',  hex: '#22C55E' },
  { name: 'YELLOW', hex: '#EAB308' },
];

interface Round {
  word: ColorOption;       // the WORD displayed
  ink: ColorOption;        // the INK colour the word is painted in
  options: ColorOption[];  // 4 options to pick from (always = COLORS_LIST shuffled)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound(): Round {
  // 75% incongruent (Stroop interference), 25% congruent.
  const word = COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)];
  let ink: ColorOption;
  if (Math.random() < 0.75) {
    do {
      ink = COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)];
    } while (ink.name === word.name);
  } else {
    ink = word;
  }
  return { word, ink, options: shuffle(COLORS_LIST) };
}

function creditsForScore(pct: number): number {
  if (pct >= 95) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  return 2;
}

/**
 * Stroop test: word vs ink colour. Tap the INK colour (not what the word
 * says). Tests selective attention + cognitive inhibition. Distinct from
 * Focus Flash (which is a go/no-go suppression).
 */
export default function ColorMatchScreen() {
  const { colors } = useThemeColors();
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [current, setCurrent] = useState<Round>(() => generateRound());
  const [picked, setPicked] = useState<string | null>(null);
  const [earnedCredits, setEarnedCredits] = useState(0);

  const startTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [round, phase]);

  const advance = useCallback((wasCorrect: boolean) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setPicked(null);
    if (wasCorrect) setCorrect((c) => c + 1);
    if (round + 1 >= TOTAL_ROUNDS) {
      finishGame(wasCorrect ? correct + 1 : correct);
    } else {
      setRound((r) => r + 1);
      setCurrent(generateRound());
    }
  }, [round, correct]);

  // Auto-skip if user doesn't pick fast enough (counts as wrong).
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setTimeout(() => advance(false), ROUND_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, round, advance]);

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'color-match' });
    setRound(0);
    setCorrect(0);
    setCurrent(generateRound());
    setPicked(null);
    startTime.current = Date.now();
    setPhase('playing');
  };

  const handlePick = (name: string) => {
    if (picked !== null) return;
    hapticLight();
    setPicked(name);
    const isRight = name === current.ink.name;
    setTimeout(() => advance(isRight), 300);
  };

  const finishGame = (finalCorrect: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const pct = Math.round((finalCorrect / TOTAL_ROUNDS) * 100);
    const credits = creditsForScore(pct);
    const won = finalCorrect >= TOTAL_ROUNDS * 0.6;
    recordGame('color-match', won, timeTaken);
    completeDailyGame(credits);
    recordCognitiveScore('attention', pct);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'color-match', correct: finalCorrect, total: TOTAL_ROUNDS, credits });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Color Match" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<ColorRecallIll size={88} />}
          title="Color Match"
          blurb="Tap the INK colour, not the word. The word will lie to you."
          rules={['Selective attention', `${TOTAL_ROUNDS} rounds`, 'Beat the clock']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const pct = Math.round((correct / TOTAL_ROUNDS) * 100);
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Color Match" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Palette size={36} color={HUE} weight="duotone" duotoneColor={HUE} duotoneOpacity={0.32} />}
          title={pct >= 95 ? 'Inhibition god' : pct >= 80 ? 'Sharp focus' : pct >= 60 ? 'Solid run' : 'Keep training'}
          bigStat={pct}
          bigStatSuffix="%"
          subtitle={`${correct} of ${TOTAL_ROUNDS} correct`}
          credits={earnedCredits}
          primaryLabel="Done"
          onPrimary={goHome}
          secondaryLabel="Play again"
          onSecondary={startGame}
        />
      </View>
    );
  }

  // ── PLAYING ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Color Match"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {round + 1} / {TOTAL_ROUNDS}
          </Text>
        }
      />
      <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl }}>
        <Text style={[styles.eyebrow, { color: colors.muted }]}>WHAT IS THE INK COLOUR?</Text>

        <View style={styles.wordWrap}>
          <Text style={[styles.word, { color: current.ink.hex }]}>
            {current.word.name}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {current.options.map((opt) => {
            const selected = picked === opt.name;
            const isWrongShown = selected && opt.name !== current.ink.name;
            const isRightShown = selected && opt.name === current.ink.name;
            return (
              <TouchableOpacity
                key={opt.name}
                activeOpacity={0.85}
                disabled={picked !== null}
                onPress={() => handlePick(opt.name)}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: selected ? `${opt.hex}25` : colors.card,
                    borderColor: isRightShown ? '#22C55E' : isWrongShown ? '#EF4444' : opt.hex,
                    borderWidth: selected ? 2.5 : 1.5,
                  },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: opt.hex }]} />
                <Text style={[styles.optionText, { color: colors.text }]}>{opt.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 18,
  },
  wordWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  word: {
    fontSize: 64,
    fontFamily: FontFamily.semibold,
    letterSpacing: -1.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 36,
  },
  optionBtn: {
    width: '48%',
    height: 64,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
  },
});
