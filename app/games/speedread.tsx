import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { DIFFICULTY_CONFIG } from '../../src/constants/games';
import GameShell, { GAME_THEMES } from '../../src/components/GameShell';
import GameComplete from '../../src/components/GameComplete';

const theme = GAME_THEMES.speedread;

interface Passage {
  words: string[];
  question: string;
  options: string[];
  answer: number;
}

const PASSAGES: Passage[] = [
  {
    words: 'The human brain uses about twenty percent of the body total energy despite being only two percent of body weight'.split(' '),
    question: 'What percentage of energy does the brain use?',
    options: ['Ten percent', 'Twenty percent', 'Thirty percent', 'Five percent'],
    answer: 1,
  },
  {
    words: 'Dolphins sleep with one eye open because only half of their brain rests at a time'.split(' '),
    question: 'How do dolphins sleep?',
    options: ['Fully awake', 'With one eye open', 'Upside down', 'In groups only'],
    answer: 1,
  },
  {
    words: 'Honey never spoils and archaeologists have found three thousand year old honey in Egyptian tombs that was still edible'.split(' '),
    question: 'Where was ancient honey found?',
    options: ['Greek ruins', 'Roman vaults', 'Egyptian tombs', 'Chinese caves'],
    answer: 2,
  },
  {
    words: 'Octopuses have three hearts and blue blood because they use copper instead of iron to carry oxygen'.split(' '),
    question: 'Why do octopuses have blue blood?',
    options: ['High salt diet', 'Copper carries oxygen', 'Cold water adaptation', 'Genetic mutation'],
    answer: 1,
  },
  {
    words: 'The speed of light is approximately three hundred thousand kilometers per second making it the fastest thing in the universe'.split(' '),
    question: 'What is the fastest thing in the universe?',
    options: ['Sound', 'Light', 'Gravity', 'Electricity'],
    answer: 1,
  },
  {
    words: 'Trees communicate with each other through underground fungal networks that scientists call the wood wide web'.split(' '),
    question: 'What do scientists call tree communication networks?',
    options: ['Root link', 'Wood wide web', 'Forest net', 'Tree talk'],
    answer: 1,
  },
  {
    words: 'Mars has the tallest mountain in our solar system called Olympus Mons which is nearly three times the height of Mount Everest'.split(' '),
    question: 'Where is Olympus Mons?',
    options: ['Jupiter', 'Venus', 'Mars', 'Saturn'],
    answer: 2,
  },
  {
    words: 'A group of flamingos is called a flamboyance and they get their pink color from eating shrimp and algae'.split(' '),
    question: 'What gives flamingos their pink color?',
    options: ['Genetics', 'Sunlight', 'Shrimp and algae', 'Water minerals'],
    answer: 2,
  },
];

const TOTAL_ROUNDS = 6;

export default function SpeedReadGame() {
  const { settings, addPoints, recordGame } = useStore();
  const difficulty = settings.difficulty;
  const multiplier = DIFFICULTY_CONFIG[difficulty].multiplier;

  const wpm = difficulty === 'easy' ? 200 : difficulty === 'medium' ? 350 : 500;
  const msPerWord = Math.round(60000 / wpm);

  const [phase, setPhase] = useState<'reading' | 'question' | 'feedback'>('reading');
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [passageIdx, setPassageIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [usedPassages] = useState(() => {
    const indices = PASSAGES.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, TOTAL_ROUNDS);
  });
  const startTime = useRef(Date.now());
  const wordAnim = useRef(new Animated.Value(0)).current;

  const passage = PASSAGES[usedPassages[passageIdx]];

  useEffect(() => {
    if (phase !== 'reading') return;
    if (currentWordIdx >= passage.words.length) {
      setPhase('question');
      return;
    }

    wordAnim.setValue(0);
    Animated.timing(wordAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      setCurrentWordIdx((i) => i + 1);
    }, msPerWord);

    return () => clearTimeout(timer);
  }, [currentWordIdx, phase]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setPhase('feedback');

    let newScore = score;
    let newCorrect = correct;

    if (idx === passage.answer) {
      const points = Math.round(20 * multiplier);
      newScore = score + points;
      newCorrect = correct + 1;
      setScore(newScore);
      setCorrect(newCorrect);
    }

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        finishGame(newCorrect, newScore);
      } else {
        setRound((r) => r + 1);
        setPassageIdx((i) => i + 1);
        setCurrentWordIdx(0);
        setSelected(null);
        setPhase('reading');
      }
    }, 800);
  };

  const finishGame = (finalCorrect: number, finalScore: number) => {
    const timeTaken = (Date.now() - startTime.current) / 1000;
    addPoints(finalScore);
    recordGame('speedread', finalCorrect >= TOTAL_ROUNDS * 0.5, timeTaken);
    setGameOver(true);
  };

  const resetGame = () => {
    setScore(0);
    setRound(1);
    setCorrect(0);
    setGameOver(false);
    setPassageIdx(0);
    setCurrentWordIdx(0);
    setSelected(null);
    setPhase('reading');
  };

  if (gameOver) {
    return (
      <GameComplete
        score={score}
        correct={correct}
        total={TOTAL_ROUNDS}
        gameTitle="Speed Reader"
        onPlayAgain={resetGame}
        gameId="speedread"
      />
    );
  }

  return (
    <GameShell title="Speed Reader" color="#FF6B35" score={score} gameId="speedread">
      <View style={styles.roundRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
          <View
            key={i}
            style={[
              styles.roundDot,
              i < round - 1 && { backgroundColor: '#FF6B35' },
              i === round - 1 && { backgroundColor: '#FF6B35', width: 16 },
            ]}
          />
        ))}
      </View>

      <View style={styles.speedBadge}>
        <Text style={styles.speedText}>{wpm} WPM</Text>
      </View>

      {phase === 'reading' ? (
        <View style={styles.readingContainer}>
          <Text style={styles.readingHint}>FOCUS ON THE WORD</Text>
          <View style={styles.wordWindow}>
            <Animated.Text
              style={[
                styles.currentWord,
                {
                  opacity: wordAnim,
                  transform: [{
                    scale: wordAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
                  }],
                },
              ]}
            >
              {currentWordIdx < passage.words.length ? passage.words[currentWordIdx] : ''}
            </Animated.Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentWordIdx / passage.words.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.wordCount}>
            {currentWordIdx} / {passage.words.length} words
          </Text>
        </View>
      ) : (
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>COMPREHENSION CHECK</Text>
          <Text style={styles.questionText}>{passage.question}</Text>

          <View style={styles.optionsContainer}>
            {passage.options.map((option, idx) => {
              let borderColor = 'rgba(255,107,53,0.2)';
              let bgColor = 'rgba(255,107,53,0.06)';

              if (selected !== null) {
                if (idx === passage.answer) {
                  borderColor = '#22C55E';
                  bgColor = 'rgba(34,197,94,0.15)';
                } else if (idx === selected) {
                  borderColor = '#EF4444';
                  bgColor = 'rgba(239,68,68,0.15)';
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionButton, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleAnswer(idx)}
                  disabled={selected !== null}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      selected !== null && idx === passage.answer && { color: '#22C55E' },
                      selected !== null && idx === selected && idx !== passage.answer && { color: '#EF4444' },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginBottom: Spacing.md,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  speedBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
    marginBottom: Spacing.xl,
  },
  speedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FF6B35',
    letterSpacing: 1,
  },
  readingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readingHint: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: Spacing.xl,
    letterSpacing: 2,
  },
  wordWindow: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.06)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
    marginBottom: Spacing.xxl,
  },
  currentWord: {
    fontSize: 44,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textShadowColor: 'rgba(255,107,53,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  wordCount: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.4)',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#FF6B35',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  questionText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  optionLetter: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FF6B35',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.15)',
    overflow: 'hidden',
  },
  optionText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
    flex: 1,
  },
});
