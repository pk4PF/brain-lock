import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Trophy } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult, GameButton } from '../../src/components/games/GameLayout';
import { WordMemoryIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { passByAccuracy } from '../../src/constants/gameDifficulty';

const HUE = GameAccents['word-recall'].hue;
const STUDY_SECONDS = 4;
const WORD_COUNT = 8;

const WORD_BANK = [
  'apple', 'bridge', 'candle', 'dream', 'eagle', 'forest',
  'garden', 'hammer', 'island', 'jungle', 'kettle', 'lantern',
  'mirror', 'needle', 'ocean', 'palace', 'quartz', 'river',
  'sunset', 'temple', 'umbrella', 'valley', 'window', 'yellow',
  'anchor', 'basket', 'circle', 'dragon', 'engine', 'feather',
  'glacier', 'harbor', 'ivory', 'jasmine', 'knight', 'ladder',
  'marble', 'napkin', 'orange', 'pepper', 'rabbit', 'silver',
  'thorn', 'umber', 'violet', 'walnut', 'xerus', 'zenith',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function creditsForScore(correct: number, total: number): number {
  // Performance-based 2-5 cells (Day-1 plan tier table).
  //   6/6 → 5,  5/6 → 4,  4/6 → 3,  ≤3/6 → 2.
  if (correct >= total) return 5;
  if (correct === total - 1) return 4;
  if (correct === total - 2) return 3;
  return 2;
}

type Phase = 'intro' | 'study' | 'recall' | 'result';

export default function WordRecallScreen() {
  const { colors } = useThemeColors();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const { earnReward, completeDailyGame, canEarnToday, setShowPaywall, recordCognitiveScore, recordGame } = useStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [studyWords, setStudyWords] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(STUDY_SECONDS);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [phase]);

  const startGame = () => {
    if (!canEarnToday()) { setShowPaywall(true); return; }
    track(Events.GameStarted, { game: 'word_recall' });

    const words = shuffle(WORD_BANK).slice(0, WORD_COUNT);
    const distractors = shuffle(WORD_BANK.filter(w => !words.includes(w))).slice(0, WORD_COUNT);
    setStudyWords(words);
    setOptions(shuffle([...words, ...distractors]));
    setSelected(new Set());
    setTimeLeft(STUDY_SECONDS);
    setPhase('study');
  };

  useEffect(() => {
    if (phase !== 'study') return;
    timerAnim.setValue(1);
    Animated.timing(timerAnim, { toValue: 0, duration: STUDY_SECONDS * 1000, useNativeDriver: false }).start();
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setPhase('recall');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const toggleWord = (word: string) => {
    hapticLight();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else if (next.size < WORD_COUNT) next.add(word);
      return next;
    });
  };

  const handleSubmit = useCallback(() => {
    hapticMedium();
    const correct = [...selected].filter(w => studyWords.includes(w)).length;
    const credits = creditsForScore(correct, WORD_COUNT);
    const passed = passByAccuracy(correct, WORD_COUNT, difficulty);
    // completeDailyGame internally calls earnReward - don't double-award.
    if (passed) doUnlock(); // pass → unlock apps (no-op in practice)
    setResultMsg(pickResultMessage(passed));
    // Recall is the % of words correctly identified. Pass directly.
    recordCognitiveScore('recall', (correct / WORD_COUNT) * 100);
    // Lifetime tile-stat counter - drives "X played" on the games tab.
    recordGame('word-recall', passed, correct);
    setEarnedCredits(credits);
    track(Events.GameCompleted, { game: 'word_recall', correct, total: WORD_COUNT, passed, credits: passed ? credits : 0 });
    setPhase('result');
  }, [selected, studyWords]);

  const correct = phase === 'result' ? [...selected].filter(w => studyWords.includes(w)).length : 0;

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="Word Recall" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<WordMemoryIll size={88} />}
          title="Word Recall"
          blurb={`Memorise ${WORD_COUNT} words in ${STUDY_SECONDS} seconds, then pick them from a grid.`}
          rules={['🧠 Working memory', `📝 ${WORD_COUNT} words`, '⏱️ <30 seconds']}
          startLabel="Start"
          onStart={startGame}
        />
      </View>
    );
  }

  // ── STUDY ──
  if (phase === 'study') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader
          title="Memorise"
          hue={HUE}
          rightSlot={
            <Text style={{ color: HUE, fontFamily: FontFamily.semibold, fontSize: 16, fontVariant: ['tabular-nums'] }}>
              {timeLeft}s
            </Text>
          }
        />
        <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl }}>
          <View style={{ paddingTop: 8, paddingBottom: 18 }}>
            <Animated.View style={{ height: 6, borderRadius: 3, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: HUE,
                  width: timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }}
              />
            </Animated.View>
          </View>
          <Text style={[s.studyEyebrow, { color: colors.muted }]}>MEMORISE THESE</Text>
          <View style={s.wordGrid}>
            {studyWords.map((word, i) => (
              <View
                key={i}
                style={[s.studyWord, { backgroundColor: colors.card, borderColor: `${HUE}33` }]}
              >
                <Text style={[s.studyWordText, { color: colors.text }]}>{word}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── RECALL ──
  if (phase === 'recall') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader
          title="Recall"
          hue={HUE}
          rightSlot={
            <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
              {selected.size}/{WORD_COUNT}
            </Text>
          }
        />
        <Animated.View style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: Spacing.xl }}>
          <Text style={[s.recallTitle, { color: colors.text }]}>Which words did you see?</Text>
          <Text style={[s.recallSub, { color: colors.secondary }]}>Pick {WORD_COUNT}.</Text>

          <View style={s.optionsGrid}>
            {options.map((word) => {
              const isSelected = selected.has(word);
              return (
                <TouchableOpacity
                  key={word}
                  activeOpacity={0.75}
                  onPress={() => toggleWord(word)}
                  style={[
                    s.optionWord,
                    {
                      backgroundColor: isSelected ? `${HUE}1A` : colors.card,
                      borderColor: isSelected ? HUE : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text style={[s.optionText, { color: isSelected ? HUE : colors.text }]}>{word}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
        <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: 30, paddingTop: 10 }}>
          <GameButton
            label={`Submit (${selected.size}/${WORD_COUNT})`}
            onPress={handleSubmit}
            hue={HUE}
            disabled={selected.size === 0}
          />
        </View>
      </View>
    );
  }

  // ── RESULT ──
  const passed = correct === WORD_COUNT; // win = a perfect run
  const resultHue = passed ? HUE : '#EF4444';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader title="Word Recall" hue={HUE} />
      <GameResult
        hue={HUE}
        badgeIcon={<Trophy size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
        title={resultMsg.title}
        message={resultMsg.line}
        passed={passed}
        bigStat={`${correct}/${WORD_COUNT}`}
        subtitle="words recalled"
        unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
        primaryLabel={passed ? 'Play again' : 'Try again'}
        onPrimary={startGame}
        secondaryLabel="Back to home"
        onSecondary={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

const s = StyleSheet.create({
  studyEyebrow: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginBottom: 14,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  studyWord: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  studyWordText: { fontSize: 17, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },

  recallTitle: { fontSize: 22, fontFamily: FontFamily.medium, letterSpacing: -0.4, marginTop: 4 },
  recallSub: { fontSize: 14, fontFamily: FontFamily.regular, marginTop: 4, marginBottom: 18 },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  optionWord: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  optionText: { fontSize: 15, fontFamily: FontFamily.medium },
});
