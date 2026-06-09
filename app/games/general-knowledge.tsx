import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Question } from 'phosphor-react-native';
import { useStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight, hapticMedium } from '../../src/utils/haptics';
import { track, Events } from '../../src/services/analytics';
import { FontFamily, Spacing, GameAccents } from '../../src/constants/theme';
import { GameHeader, GameIntro, GameResult } from '../../src/components/games/GameLayout';
import { GeneralKnowledgeIll } from '../../src/components/games/GameIllustrations';
import { pickResultMessage, type ResultMessage } from '../../src/constants/testMessages';
import { useChallengeUnlock } from '../../src/hooks/useChallengeUnlock';
import { TRIVIA, type TriviaQuestion } from '../../src/constants/trivia';
import type { Difficulty } from '../../src/constants/games';

const HUE = GameAccents['general-knowledge'].hue;

const QUESTION_COUNT: Record<Difficulty, number> = { easy: 3, medium: 5, hard: 8 };

type Phase = 'intro' | 'playing' | 'result';

interface Round {
  q: string;
  options: string[];
  answer: number; // index into shuffled options
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(count: number): Round[] {
  return shuffle(TRIVIA).slice(0, count).map((item: TriviaQuestion) => {
    const correctText = item.options[item.answer];
    const opts = shuffle(item.options);
    return { q: item.q, options: opts, answer: opts.indexOf(correctText) };
  });
}

export default function GeneralKnowledgeScreen() {
  const { colors } = useThemeColors();
  const { recordGame, recordCognitiveScore } = useStore();
  const { isUnlock, difficulty, unlockMinutes, doUnlock } = useChallengeUnlock();
  const count = QUESTION_COUNT[difficulty];

  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<Round[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [resultMsg, setResultMsg] = useState<ResultMessage>(() => pickResultMessage(true));

  const handleStart = () => {
    setRounds(buildRounds(count));
    setIdx(0);
    setCorrect(0);
    setSelected(null);
    setStartedAt(Date.now());
    track(Events.GameStarted, { game: 'general-knowledge', difficulty });
    setPhase('playing');
  };

  const finishGame = (finalCorrect: number) => {
    const timeTaken = (Date.now() - startedAt) / 1000;
    const passed = finalCorrect === count; // quizzes = all-or-nothing
    recordGame('general-knowledge', passed, timeTaken);
    if (passed) doUnlock();
    setResultMsg(pickResultMessage(passed));
    recordCognitiveScore('problemSolving', (finalCorrect / count) * 100);
    track(Events.GameCompleted, {
      game: 'general-knowledge', correct: finalCorrect, total: count, difficulty, passed,
    });
    setPhase('result');
  };

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    const isRight = i === rounds[idx].answer;
    if (isRight) hapticLight(); else hapticMedium();
    setSelected(i);
    const newCorrect = isRight ? correct + 1 : correct;
    if (isRight) setCorrect(newCorrect);
    setTimeout(() => {
      if (idx + 1 >= count) {
        finishGame(newCorrect);
      } else {
        setIdx(idx + 1);
        setSelected(null);
      }
    }, 650);
  };

  // ── INTRO ──
  if (phase === 'intro') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="General Knowledge" hue={HUE} />
        <GameIntro
          hue={HUE}
          Illustration={<GeneralKnowledgeIll size={88} />}
          title="General Knowledge"
          blurb="Answer every question correctly to pass. One wrong answer and you fail."
          rules={[`❓ ${count} questions`, '✅ All correct to pass', '🔓 Pass to unlock']}
          startLabel="Start"
          onStart={handleStart}
        />
      </View>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const passed = correct === count; // quizzes = all-or-nothing
    const resultHue = passed ? HUE : '#EF4444';
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <GameHeader title="General Knowledge" hue={HUE} />
        <GameResult
          hue={HUE}
          badgeIcon={<Question size={36} color={resultHue} weight="duotone" duotoneColor={resultHue} duotoneOpacity={0.32} />}
          title={resultMsg.title}
          message={resultMsg.line}
          passed={passed}
          bigStat={`${correct}/${count}`}
          subtitle="correct"
          unlockMinutes={isUnlock && passed ? unlockMinutes : undefined}
          primaryLabel={passed ? 'Play again' : 'Try again'}
          onPrimary={handleStart}
          secondaryLabel="Back to home"
          onSecondary={() => router.replace('/(tabs)')}
        />
      </View>
    );
  }

  // ── PLAYING ──
  const round = rounds[idx];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GameHeader
        title="General Knowledge"
        hue={HUE}
        rightSlot={
          <Text style={{ color: colors.muted, fontFamily: FontFamily.medium, fontSize: 13 }}>
            {idx + 1} / {count}
          </Text>
        }
      />
      <View style={styles.qArea}>
        <Text style={[styles.question, { color: colors.text }]}>{round.q}</Text>
      </View>
      <View style={styles.options}>
        {round.options.map((opt, i) => {
          let bg = colors.card;
          let border = colors.border;
          let textCol = colors.text;
          if (selected !== null) {
            if (i === round.answer) { bg = `${HUE}14`; border = HUE; textCol = HUE; }
            else if (i === selected) { bg = 'rgba(239,68,68,0.10)'; border = '#EF4444'; textCol = '#EF4444'; }
          }
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              disabled={selected !== null}
              onPress={() => handleAnswer(i)}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
            >
              <Text style={[styles.optionText, { color: textCol }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  qArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  question: {
    fontSize: 26,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: 'center',
  },
  options: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: 12,
  },
  option: {
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  optionText: {
    fontSize: 17,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});
