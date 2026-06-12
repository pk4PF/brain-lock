import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Hash, Backspace, Check } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium, hapticSuccess } from '../../src/utils/haptics';
import { soundTap, soundCorrect, soundWrong, soundComplete, soundFail } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { RapidNumbersIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { DIGIT_LEVEL } from '../../src/constants/gameDifficulty';

const HUE = GameAccents['digit-span'].hue;
const START_LEVEL = 3;
const MAX_LEVEL = 15;

const { width: SW } = Dimensions.get('window');
const KEY_GAP = 10;
const KEY_W = Math.min(96, Math.floor((SW - Spacing.xl * 2 - KEY_GAP * 2) / 3));

type Phase = 'intro' | 'playing' | 'result';
// Per-level state machine: showing (memorise the number) → input (type it back).
type LevelState = 'showing' | 'input';

function creditsForLevel(maxLevel: number): number {
  if (maxLevel >= 10) return 5;
  if (maxLevel >= 8) return 4;
  if (maxLevel >= 6) return 3;
  return 2;
}

function randomDigits(n: number): string {
  // First digit non-zero so the number reads naturally.
  let s = String(1 + Math.floor(Math.random() * 9));
  for (let i = 1; i < n; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

// Study time scales with length: ~350ms per digit + 900ms base, capped.
function studyMsFor(n: number): number {
  return Math.min(4500, 900 + n * 350);
}

/**
 * Number Memory - the Human Benchmark digit-span test, honest version.
 * A number flashes large and centred, then hides; you type it back from
 * memory on an in-app keypad (no system keyboard = no autocomplete cheese).
 * Each correct answer adds a digit. One miss ends it.
 */
export default function DigitSpanScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const targetLevel = DIGIT_LEVEL[difficulty];

  const [phase, setPhase] = useState<Phase>('intro');
  const [levelState, setLevelState] = useState<LevelState>('showing');
  const [level, setLevel] = useState(START_LEVEL);
  const [target, setTarget] = useState('');
  const [input, setInput] = useState('');
  const [maxCompleted, setMaxCompleted] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  const beginLevel = (n: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTarget(randomDigits(n));
    setInput('');
    setLevelState('showing');
    hideTimer.current = setTimeout(() => setLevelState('input'), studyMsFor(n));
  };

  const startGame = () => {
    track(Events.GameStarted, { game: 'digit-span' });
    setMaxCompleted(0);
    setLevel(START_LEVEL);
    startTime.current = Date.now();
    setPhase('playing');
    beginLevel(START_LEVEL);
  };

  const handleKey = (digit: string) => {
    if (levelState !== 'input' || input.length >= target.length) return;
    hapticLight();
    soundTap();
    setInput(input + digit);
  };

  const handleBackspace = () => {
    if (levelState !== 'input' || input.length === 0) return;
    hapticLight();
    setInput(input.slice(0, -1));
  };

  const handleSubmit = () => {
    if (levelState !== 'input' || input.length === 0) return;

    if (input === target) {
      hapticSuccess();
      soundCorrect();
      const newMax = Math.max(maxCompleted, level);
      setMaxCompleted(newMax);
      if (level >= MAX_LEVEL) {
        finishGame(newMax);
      } else {
        const next = level + 1;
        setLevel(next);
        beginLevel(next);
      }
    } else {
      hapticMedium();
      soundWrong();
      finishGame(maxCompleted);
    }
  };

  const finishGame = (finalMax: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const passed = finalMax >= targetLevel;
    if (passed) soundComplete(); else soundFail();
    recordGame('digit-span', passed, timeTaken);
    if (passed) doUnlock();
    setResultMsg(pickResultMessage(passed));
    // Memory map: level 3 = 20, level 12 = 100, clamped.
    const memScore = Math.max(0, Math.min(100, 20 + (finalMax - START_LEVEL) * (80 / 9)));
    recordCognitiveScore('memory', memScore);
    track(Events.GameCompleted, {
      game: 'digit-span', max_level: finalMax, target_level: targetLevel, passed,
      credits: passed ? creditsForLevel(finalMax) : 0,
    });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Number Memory" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<RapidNumbersIll size={88} />}
          title="Number Memory"
          blurb={`A number flashes, then hides — type it back from memory. Each level adds a digit. The average person holds 7 digits. Reach level ${targetLevel} to pass.`}
          rules={['🔢 Starts at 3 digits', `🎯 Reach level ${targetLevel}`, '❌ One miss ends it']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = maxCompleted >= targetLevel;
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Number Memory" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Hash size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={maxCompleted}
          subtitle="Digits held — average is 7"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={startGame}
          secondaryLabel="Back to home"
          onSecondary={goHome}
        />
      </View>
    );
  }

  // ── PLAYING ──
  const keypadRows: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'submit'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title={levelState === 'showing' ? 'Memorise' : 'Recall'}
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            Level {level}
          </Text>
        }
      />

      <View style={styles.stage}>
        {levelState === 'showing' ? (
          <>
            <Text style={[styles.targetNumber, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
              {target}
            </Text>
            <Text style={[styles.hint, { color: colors.muted }]}>Hold it in your head…</Text>
          </>
        ) : (
          <>
            <Text style={[styles.inputNumber, { color: input.length > 0 ? colors.text : colors.muted }]} numberOfLines={1} adjustsFontSizeToFit>
              {input.length > 0 ? input : '· · ·'}
            </Text>
            <Text style={[styles.hint, { color: colors.muted }]}>
              Type the {target.length}-digit number
            </Text>
          </>
        )}
      </View>

      {levelState === 'input' && (
        <View style={styles.keypad}>
          {keypadRows.map((row, ri) => (
            <View key={ri} style={styles.keyRow}>
              {row.map((key) => {
                if (key === 'back') {
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.7}
                      onPress={handleBackspace}
                      style={[styles.key, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
                    >
                      <Backspace size={24} color={colors.text} />
                    </TouchableOpacity>
                  );
                }
                if (key === 'submit') {
                  const ready = input.length > 0;
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.85}
                      onPress={handleSubmit}
                      disabled={!ready}
                      style={[styles.key, { backgroundColor: ready ? HUE : colors.cardAlt, borderColor: ready ? HUE : colors.border, opacity: ready ? 1 : 0.5 }]}
                    >
                      <Check size={24} color={ready ? '#FFFFFF' : colors.muted} weight="bold" />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.7}
                    onPress={() => handleKey(key)}
                    style={[styles.key, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  targetNumber: {
    fontSize: 64,
    fontFamily: FontFamily.semibold,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  inputNumber: {
    fontSize: 48,
    fontFamily: FontFamily.semibold,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginTop: 14,
  },
  keypad: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  key: {
    width: KEY_W,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontFamily: FontFamily.semibold,
    fontVariant: ['tabular-nums'],
  },
});
