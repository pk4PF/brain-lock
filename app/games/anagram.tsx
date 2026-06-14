import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { TextAa } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { soundTap, soundCorrect, soundWrong, soundComplete, soundFail, soundRound } from '../../src/utils/sounds';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { WordMemoryIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { passByAccuracy } from '../../src/constants/gameDifficulty';

const HUE = GameAccents.anagram.hue;
const TOTAL_ROUNDS = 6;

type Phase = 'intro' | 'playing' | 'result';

// 5- and 6-letter words. Avoided rare/awkward words; all are common enough
// that an adult will recognise them when scrambled but not so trivial that
// the game becomes pointless.
const WORD_BANK = [
  // 5-letter
  'apple', 'bread', 'chair', 'dance', 'eagle', 'flame', 'glass', 'heart',
  'image', 'judge', 'knife', 'lemon', 'maple', 'noble', 'ocean', 'paper',
  'queen', 'river', 'stone', 'tiger', 'urban', 'voice', 'water', 'youth',
  'zebra', 'amber', 'brave', 'cloud', 'dream', 'earth', 'globe', 'happy',
  'lunar', 'metal', 'novel', 'olive', 'piano', 'quiet', 'royal', 'salad',
  'tower', 'unity', 'wagon', 'beach', 'candy', 'chess', 'cobra', 'crown',
  'diary', 'fruit', 'ghost', 'grape', 'honey', 'horse', 'juice', 'laser',
  'light', 'mango', 'money', 'mouse', 'music', 'night', 'pearl', 'pizza',
  'plant', 'pride', 'prize', 'robot', 'shark', 'sheep', 'smile', 'snake',
  'spice', 'sport', 'storm', 'sugar', 'sword', 'table', 'theme', 'toast',
  'train', 'whale', 'witch', 'world',
  // 6-letter
  'animal', 'bridge', 'castle', 'dragon', 'engine', 'forest', 'garden',
  'hammer', 'island', 'jacket', 'kitten', 'ladder', 'mirror', 'needle',
  'orange', 'pencil', 'quartz', 'rocket', 'silver', 'temple', 'violet',
  'window', 'yellow', 'basket', 'branch', 'button', 'candle', 'cheese',
  'circle', 'coffee', 'cotton', 'dollar', 'donkey', 'flower', 'guitar',
  'helmet', 'jungle', 'market', 'monkey', 'museum', 'parrot', 'pirate',
  'planet', 'pocket', 'potato', 'puzzle', 'rabbit', 'ribbon', 'school',
  'shadow', 'singer', 'soccer', 'spider', 'spring', 'square', 'summer',
  'throne', 'tunnel', 'turtle', 'valley', 'winter', 'wizard',
];

function shuffleLetters(word: string): string {
  const letters = word.split('');
  // Keep shuffling until it's actually different from the original.
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    if (letters.join('') !== word) return letters.join('').toUpperCase();
  }
  return letters.join('').toUpperCase();
}

function pickRounds(): { word: string; scrambled: string }[] {
  const pool = [...WORD_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, TOTAL_ROUNDS).map((w) => ({ word: w, scrambled: shuffleLetters(w) }));
}

function creditsForScore(correct: number, total: number): number {
  const pct = (correct / total) * 100;
  if (pct >= 100) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  return 2;
}

/**
 * Anagram unscrambling. Show scrambled letters, type the original word.
 * Tests verbal retrieval - distinct from Word Recall (which is recognition
 * from a grid of options after a brief study window).
 */
export default function AnagramScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { completeDailyGame, recordGame, recordCognitiveScore, canEarnToday, setShowPaywall } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<{ word: string; scrambled: string }[]>([]);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const startTime = useRef(0);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    if (phase === 'playing') setTimeout(() => inputRef.current?.focus(), 100);
  }, [round, phase]);

  const startGame = () => {
    track(Events.GameStarted, { game: 'anagram' });
    setRounds(pickRounds());
    setRound(0);
    setCorrect(0);
    setInput('');
    setFeedback(null);
    startTime.current = Date.now();
    setPhase('playing');
  };

  const submit = () => {
    if (feedback !== null) return;
    const guess = input.trim().toLowerCase();
    if (guess.length === 0) return;
    hapticMedium();
    soundTap();
    const isRight = guess === rounds[round].word;
    setFeedback(isRight ? 'correct' : 'wrong');
    if (isRight) { soundCorrect(); setCorrect((c) => c + 1); }
    else soundWrong();

    setTimeout(() => {
      setFeedback(null);
      setInput('');
      if (round + 1 >= TOTAL_ROUNDS) {
        finishGame(isRight ? correct + 1 : correct);
      } else {
        soundRound();
        setRound((r) => r + 1);
      }
    }, 900);
  };

  const skip = () => {
    if (feedback !== null) return;
    hapticLight();
    soundWrong();
    setFeedback('wrong');
    setTimeout(() => {
      setFeedback(null);
      setInput('');
      if (round + 1 >= TOTAL_ROUNDS) finishGame(correct);
      else { soundRound(); setRound((r) => r + 1); }
    }, 900);
  };

  const finishGame = (finalCorrect: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    const credits = creditsForScore(finalCorrect, TOTAL_ROUNDS);
    const passed = passByAccuracy(finalCorrect, TOTAL_ROUNDS, difficulty);
    if (passed) soundComplete(); else soundFail();
    recordGame('anagram', passed, timeTaken);
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    recordCognitiveScore('problemSolving', (finalCorrect / TOTAL_ROUNDS) * 100);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'anagram', correct: finalCorrect, total: TOTAL_ROUNDS, passed, credits: passed ? credits : 0 });
    setPhase('result');
  };

  const goHome = () => router.replace('/(tabs)');

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Anagram" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<WordMemoryIll size={88} />}
          title="Anagram"
          blurb="Unscramble the letters into a word."
          rules={['🔤 Verbal recall', `📝 ${TOTAL_ROUNDS} words`, '⏭️ Skip if stuck']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = passByAccuracy(correct, TOTAL_ROUNDS, difficulty);
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Anagram" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<TextAa size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          passed={passed}
          bigStat={`${correct}/${TOTAL_ROUNDS}`}
          subtitle="Words solved"
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
  const currentRound = rounds[round];
  const showAnswer = feedback === 'wrong';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="Anagram"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {round + 1} / {TOTAL_ROUNDS}
          </Text>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl }}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>UNSCRAMBLE THIS</Text>

          <View style={styles.scrambledRow}>
            {currentRound.scrambled.split('').map((ch, i) => (
              <View
                key={i}
                style={[styles.letterTile, { backgroundColor: colors.card, borderColor: `${HUE}40` }]}
              >
                <Text style={[styles.letterText, { color: colors.text }]}>{ch}</Text>
              </View>
            ))}
          </View>

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor:
                  feedback === 'correct' ? '#22C55E' :
                  feedback === 'wrong'   ? '#EF4444' :
                  colors.border,
              },
            ]}
            placeholder="type the word"
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={feedback === null}
            maxLength={14}
          />

          {showAnswer && (
            <Text style={[styles.answerHint, { color: colors.muted }]}>
              Was: <Text style={{ color: colors.text, fontFamily: FontFamily.semibold }}>{currentRound.word}</Text>
            </Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={submit}
              disabled={feedback !== null || input.trim().length === 0}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: input.trim().length > 0 && feedback === null ? HUE : colors.cardAlt,
                  opacity: input.trim().length > 0 && feedback === null ? 1 : 0.6,
                },
              ]}
            >
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={skip}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              style={styles.skipBtn}
            >
              <Text style={[styles.skipText, { color: colors.muted }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
  },
  scrambledRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  letterTile: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    fontSize: 22,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  answerHint: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  actions: {
    marginTop: 28,
    alignItems: 'center',
    gap: 6,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  skipBtn: {
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
});
