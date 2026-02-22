import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Unlock, Zap, ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { useStore } from '../../src/store/useStore';
import { GAMES } from '../../src/constants/games';

export default function ChallengeGate() {
  const { settings } = useStore();
  const params = useLocalSearchParams<{ app?: string }>();
  const appName = params.app || 'the app';

  const [challengesCompleted, setChallengesCompleted] = useState(0);
  const required = settings.challengesRequired;

  const enabledGames = settings.enabledGames;
  const randomGame = enabledGames[Math.floor(Math.random() * enabledGames.length)];

  const handleStartChallenge = () => {
    router.push(`/games/${randomGame}`);
  };

  const allDone = challengesCompleted >= required;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.lockIcon}>
          {allDone ? (
            <Unlock size={40} color={Colors.success} />
          ) : (
            <Lock size={40} color={Colors.accent} />
          )}
        </View>

        <Text style={styles.title}>{appName} is Locked</Text>
        <Text style={styles.subtitle}>
          Complete {required} brain challenge{required > 1 ? 's' : ''} to unlock
        </Text>

        <View style={styles.progressRow}>
          {Array.from({ length: required }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < challengesCompleted && styles.progressDotCompleted,
              ]}
            >
              {i < challengesCompleted ? (
                <Text style={styles.progressCheck}>✓</Text>
              ) : (
                <Text style={styles.progressDotText}>{i + 1}</Text>
              )}
            </View>
          ))}
        </View>

        {!allDone ? (
          <TouchableOpacity
            style={styles.challengeButton}
            onPress={handleStartChallenge}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.accent, Colors.accentDark]}
              style={styles.challengeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Zap size={20} color="#0A0A0F" />
              <Text style={styles.challengeText}>Start Challenge</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.unlockedContainer}>
            <View style={styles.unlockedIcon}>
              <Unlock size={36} color={Colors.success} />
            </View>
            <Text style={styles.unlockedText}>App Unlocked!</Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => router.back()}
            >
              <Text style={styles.openText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color={Colors.secondary} />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  lockIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  progressCheck: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFF',
  },
  progressDotText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  challengeButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  challengeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  challengeText: {
    color: '#0A0A0F',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  unlockedContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  unlockedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  unlockedText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginBottom: Spacing.md,
  },
  openButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
  },
  openText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  backText: {
    color: Colors.secondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
