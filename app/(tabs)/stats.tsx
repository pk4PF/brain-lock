import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { Share2, Brain, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import type { CognitiveArea } from '../../src/store/useStore';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, Spacing } from '../../src/constants/theme';
import { brainScoreEstimate, brainScoreShareMessage, scoreBand, getRank, getBrainAge } from '../../src/utils/brainScore';
import { startBenchmark } from '../../src/utils/benchmark';
import { hapticLight } from '../../src/utils/haptics';

// ─────────────────────────────────────────────────────────────
// The Brainpower Score. One number, one gauge, one share button - plus a
// breakdown of the cognitive areas the Brain Gym builds.
//
// Key design call: the areas below DON'T carry a competing 0-100 score.
// The overall is also dragged down by scrolling, so the areas can't "sum"
// to it. Instead they show what you've *trained* (a fill + a tier), the
// pure up-side. Overall = trained foundation − scrolling drain.
// ─────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return '#22C55E'; // sharp - green
  if (score >= 45) return '#F97316'; // mid - orange
  return '#EF4444';                  // cooked - red
}

const ASPECTS: { key: CognitiveArea; label: string }[] = [
  { key: 'memory', label: 'Memory' },
  { key: 'attention', label: 'Attention span' },
  { key: 'problemSolving', label: 'Problem solving' },
  { key: 'speed', label: 'Reaction time' },
  { key: 'mindfulness', label: 'Calm' },
  { key: 'knowledge', label: 'General knowledge' },
];

const GAUGE = 176;
const STROKE = 14;
const R = (GAUGE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function Gauge({ score, color, track }: { score: number; color: string; track: string }) {
  const offset = CIRC * (1 - score / 100);
  return (
    <Svg width={GAUGE} height={GAUGE}>
      <Circle cx={GAUGE / 2} cy={GAUGE / 2} r={R} stroke={track} strokeWidth={STROKE} fill="none" />
      <G rotation={-90} origin={`${GAUGE / 2}, ${GAUGE / 2}`}>
        <Circle
          cx={GAUGE / 2}
          cy={GAUGE / 2}
          r={R}
          stroke={color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

export default function StatsScreen() {
  const { brainScore, dailyScreenTimeHours, progress, cognitiveScores } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const measured = brainScore !== null;
  const result = measured
    ? { score: Math.round(brainScore!), ...scoreBand(Math.round(brainScore!)) }
    : brainScoreEstimate(dailyScreenTimeHours, progress.gamesPlayed);
  const color = scoreColor(result.score);
  const rank = getRank(result.score);
  const brainAge = getBrainAge(result.score);
  const shareRef = useRef<View>(null);

  const onShare = async () => {
    hapticLight();
    try {
      const uri = await captureRef(shareRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: brainScoreShareMessage(result) });
      }
    } catch {
      // Share/capture unavailable in this build - fail quietly.
    }
  };

  // Unmeasured - one clean prompt, vertically centred.
  if (!measured) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.body, styles.centerAll, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }]}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>YOUR BRAINPOWER SCORE</Text>
          <View style={{ height: 24 }} />
          <View style={[styles.benchIcon, { backgroundColor: `${colors.accent}14`, borderColor: `${colors.accent}33` }]}>
            <Brain size={44} color={colors.accent} strokeWidth={1.8} />
          </View>
          <Text style={[styles.benchTitle, { color: colors.text }]}>Measure your Brainpower Score</Text>
          <Text style={[styles.benchSub, { color: colors.muted }]}>A few quick tests sets your score.</Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => { hapticLight(); startBenchmark(); }}
            style={[styles.cta, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.ctaText}>Take the benchmark</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xxl,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: Spacing.xl,
        }}
      >
        <FadeInView delay={0}>
          <Text style={[styles.eyebrow, { color: colors.muted }]}>YOUR BRAINPOWER SCORE</Text>
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.gaugeWrap}>
            <Gauge score={result.score} color={color} track={colors.cardAlt} />
            <View style={styles.gaugeCenter} pointerEvents="none">
              <Text style={[styles.gaugeScore, { color }]}>{result.score}</Text>
              <Text style={[styles.gaugeBand, { color }]}>{result.label.toUpperCase()}</Text>
              <Text style={[styles.brainAge, { color: colors.muted }]}>Brain Age: {brainAge}</Text>
            </View>
          </View>

          {/* Rank + how close to the next one */}
          <View style={styles.rankBox}>
            <View style={styles.rankRow}>
              <Text style={[styles.rankCurrent, { color: colors.text }]}>{rank.emoji} {rank.name}</Text>
              {!rank.isMax && <Text style={[styles.rankNext, { color: colors.muted }]}>{rank.nextEmoji} {rank.nextName}</Text>}
            </View>
            <View style={[styles.rankTrack, { backgroundColor: colors.cardAlt }]}>
              <View style={[styles.rankFill, { width: `${Math.max(3, Math.round(rank.progress * 100))}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.rankToNextText, { color: colors.muted }]}>
              {rank.isMax ? 'Top rank reached' : `${rank.toNext} points to ${rank.nextName}`}
            </Text>
          </View>
        </FadeInView>

        {/* Cognitive areas - the long-term breakdown of what the Brain Gym has
            built. Each area carries its own trained 0-100 level, raised over
            time (not a daily reset). */}
        <FadeInView delay={160}>
          <View style={styles.breakdownHead}>
            <Text style={[styles.breakdownTitle, { color: colors.muted }]}>YOUR COGNITIVE AREAS</Text>
          </View>
          <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {ASPECTS.map((a, i) => {
              const pct = Math.round(cognitiveScores[a.key] ?? 0);
              return (
                <View key={a.key} style={[styles.aspectRow, i < ASPECTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <View style={styles.aspectTop}>
                    <Text style={[styles.aspectLabel, { color: colors.text }]}>{a.label}</Text>
                    <Text style={[styles.aspectTier, { color: pct > 0 ? colors.accent : colors.muted }]}>{pct > 0 ? pct : '—'}</Text>
                  </View>
                  <View style={[styles.aspectTrack, { backgroundColor: colors.cardAlt }]}>
                    <View style={[styles.aspectFill, { width: `${Math.max(0, pct)}%`, backgroundColor: colors.accent }]} />
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={[styles.breakdownNote, { color: colors.muted }]}>
            Train in the Brain Gym to build each area and raise your score.
          </Text>
        </FadeInView>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { hapticLight(); router.push('/(tabs)/games'); }}
          style={styles.gymLink}
        >
          <Text style={[styles.gymLinkText, { color: colors.accent }]}>Raise it in the Brain Gym</Text>
          <ChevronRight size={16} color={colors.accent} strokeWidth={2.4} />
        </TouchableOpacity>

        {/* Share lives at the bottom - the page leads with the score, ends with
            the brag. */}
        <FadeInView delay={240}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onShare}
            style={[styles.cta, styles.shareCtaBottom, { backgroundColor: colors.accent }]}
          >
            <Share2 size={18} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.ctaText}>Share my score</Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>

      {/* Hidden branded share card - captured by view-shot, never on screen. */}
      <View collapsable={false} ref={shareRef} style={styles.shareCard}>
        <LinearGradient
          colors={['#F2660E', '#D94F00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.shareCardInner}
        >
          <Image source={require('../../assets/icon.png')} style={styles.shareLogo} resizeMode="contain" />
          <Text style={styles.shareCardEyebrow}>MY BRAINPOWER SCORE</Text>
          <Text style={styles.shareCardScore}>{result.score}</Text>
          <Text style={styles.shareCardBand}>{result.emoji}  {result.label}</Text>
          <Text style={styles.shareCardAge}>Brain Age: {brainAge}</Text>
          <View style={styles.shareCardMeterTrack}>
            <View style={[styles.shareCardMeterFill, { width: `${Math.max(3, result.score)}%` }]} />
          </View>
          <Text style={styles.shareCardCta}>Can you beat it?  ·  Brainlock</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: Spacing.xl },
  centerAll: { alignItems: 'center', justifyContent: 'center' },
  eyebrow: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.8,
    textAlign: 'center',
  },

  // Gauge
  gaugeWrap: { width: GAUGE, height: GAUGE, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 4, alignSelf: 'center' },
  gaugeCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gaugeEmoji: { fontSize: 30, marginBottom: 2 },
  gaugeScore: { fontSize: 60, fontFamily: FontFamily.heavy, letterSpacing: -2, lineHeight: 64, fontVariant: ['tabular-nums'] },
  gaugeBand: { fontSize: 12, fontFamily: FontFamily.semibold, letterSpacing: 1.2, marginTop: 1 },
  brainAge: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 4 },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 40,
    borderRadius: 999,
    marginTop: 8,
    alignSelf: 'center',
  },
  shareCta: { marginTop: 12 },
  shareCtaBottom: { marginTop: 18 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  gymLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, marginTop: 16 },
  gymLinkText: { fontSize: 14, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },

  // Rank + progress to next
  rankBox: { width: '100%', marginTop: 10 },
  rankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  rankCurrent: { fontSize: 15, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  rankNext: { fontSize: 13, fontFamily: FontFamily.medium },
  rankTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  rankFill: { height: '100%', borderRadius: 5 },
  rankToNextText: { fontSize: 12, fontFamily: FontFamily.medium, marginTop: 7, textAlign: 'center' },

  // Breakdown
  breakdownHead: { width: '100%', marginTop: 16, marginBottom: 6 },
  breakdownTitle: { fontSize: 12, fontFamily: FontFamily.medium, letterSpacing: 1.6 },
  breakdownCard: { width: '100%', borderRadius: 18, borderWidth: 1, paddingHorizontal: 18 },
  dailyTopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  dailyLabel: { fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  dailySub: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 3 },
  dailyScore: { fontSize: 40, fontFamily: FontFamily.heavy, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  aspectRow: { paddingVertical: 9 },
  aspectTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  aspectLabel: { fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
  aspectTier: { fontSize: 12, fontFamily: FontFamily.semibold, letterSpacing: 0.4 },
  aspectTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  aspectFill: { height: '100%', borderRadius: 4 },
  breakdownNote: { width: '100%', fontSize: 13, fontFamily: FontFamily.regular, lineHeight: 19, marginTop: 12 },

  // Unmeasured
  benchIcon: { width: 88, height: 88, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  benchTitle: { fontSize: 26, fontFamily: FontFamily.medium, letterSpacing: -0.6, textAlign: 'center' },
  benchSub: { fontSize: 15, fontFamily: FontFamily.regular, marginTop: 8, marginBottom: 28, textAlign: 'center' },

  // Hidden share card
  shareCard: { position: 'absolute', left: -10000, top: 0, width: 340 },
  shareCardInner: { width: 340, paddingVertical: 48, paddingHorizontal: 32, borderRadius: 28, alignItems: 'center' },
  shareLogo: { width: 64, height: 64, borderRadius: 16, marginBottom: 24 },
  shareCardEyebrow: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FontFamily.medium, letterSpacing: 2, marginBottom: 6 },
  shareCardScore: { color: '#FFFFFF', fontSize: 116, fontFamily: FontFamily.heavy, lineHeight: 120, letterSpacing: -4, fontVariant: ['tabular-nums'] },
  shareCardBand: { color: '#FFFFFF', fontSize: 22, fontFamily: FontFamily.semibold, marginTop: 4, marginBottom: 8 },
  shareCardAge: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontFamily: FontFamily.medium, marginBottom: 24 },
  shareCardMeterTrack: { width: '100%', height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden', marginBottom: 28 },
  shareCardMeterFill: { height: '100%', borderRadius: 5, backgroundColor: '#FFFFFF' },
  shareCardCta: { color: 'rgba(255,255,255,0.95)', fontSize: 16, fontFamily: FontFamily.semibold, letterSpacing: -0.2 },
});
