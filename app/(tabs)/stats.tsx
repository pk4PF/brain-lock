import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Brain } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import type { CognitiveArea, CognitiveScores } from '../../src/store/useStore';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { FontFamily, FontSize, Spacing, GameAccents } from '../../src/constants/theme';
import { Eyebrow, SectionHeading, MutedText, AnvilCard } from '../../src/components/ui/anvil';

// ─────────────────────────────────────────────────────────────
// Brain Profile - five cognitive attributes, each scored 0-100.
// This is the "you're getting smarter" surface: it shows
// concrete capacities, not Tinder-style streak shame.
// ─────────────────────────────────────────────────────────────

interface AttributeMeta {
  key: CognitiveArea;
  label: string;
  blurb: string;
  hue: string;
  source: string; // which game trains it (shown in subtitle)
}

const ATTRIBUTES: AttributeMeta[] = [
  { key: 'memory',         label: 'Memory',         blurb: 'Visual pattern recall',  hue: GameAccents.memory.hue,        source: 'Memory Match' },
  { key: 'recall',         label: 'Verbal Recall',  blurb: 'Word memory in 5s',      hue: GameAccents['word-recall'].hue, source: 'Word Recall' },
  { key: 'attention',      label: 'Attention',      blurb: 'Filtering distraction',  hue: GameAccents.focus.hue,         source: 'Focus Flash' },
  { key: 'problemSolving', label: 'Problem Solving',blurb: 'Math under pressure',    hue: GameAccents.math.hue,          source: 'Quick Math' },
];

function band(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Sharp';
  if (score >= 60) return 'Steady';
  if (score >= 40) return 'Building';
  if (score > 0)   return 'Warming up';
  return 'Untested';
}

// Secondary label shown under the score on each row. Always forward-leaning -
// no "below average" or "bottom tier" copy, since those tank retention for new
// players who haven't had time to climb yet.
function tier(score: number): string {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Sharp';
  if (score >= 60) return 'Steady';
  if (score >= 40) return 'Building';
  if (score > 0)   return 'Warming up';
  return '-';
}

function avgScore(scores: CognitiveScores): number {
  const tested = Object.values(scores).filter((s) => s > 0);
  if (tested.length === 0) return 0;
  return Math.round(tested.reduce((a, b) => a + b, 0) / tested.length);
}

// ─────────────────────────────────────────────────────────────
// Single attribute row: label + tier + horizontal bar
// ─────────────────────────────────────────────────────────────
function AttributeRow({ meta, score, isLast }: { meta: AttributeMeta; score: number; isLast: boolean }) {
  const { colors } = useThemeColors();
  const tested = score > 0;
  return (
    <View style={[styles.attrRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <View style={styles.attrTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.attrLabel, { color: colors.text }]}>{meta.label}</Text>
          <Text style={[styles.attrBlurb, { color: colors.muted }]}>
            {meta.blurb} · {meta.source}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.attrScore, { color: tested ? meta.hue : colors.muted }]}>
            {tested ? score : '-'}
          </Text>
          <Text style={[styles.attrTier, { color: colors.muted }]}>
            {tier(score)}
          </Text>
        </View>
      </View>

      <View style={[styles.attrBarTrack, { backgroundColor: colors.cardAlt }]}>
        <View
          style={[
            styles.attrBarFill,
            {
              width: tested ? `${Math.max(2, score)}%` : '0%',
              backgroundColor: meta.hue,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Mini weekly chart - kept but tucked under the profile.
// ─────────────────────────────────────────────────────────────
function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  const { colors } = useThemeColors();

  return (
    <View style={styles.chartRow}>
      {data.map((val, i) => {
        const pct = Math.max(4, (val / max) * 100);
        const isToday = i === today;
        return (
          <View key={i} style={styles.chartCol}>
            <View style={[styles.chartTrack, { backgroundColor: colors.cardAlt }]}>
              <View
                style={[
                  styles.chartBar,
                  { height: `${pct}%`, backgroundColor: isToday ? colors.accent : colors.border },
                ]}
              />
            </View>
            <Text style={[styles.chartDay, {
              color: isToday ? colors.accent : colors.muted,
              fontFamily: FontFamily.medium,
            }]}>{days[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { progress, cognitiveScores } = useStore();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const overall = avgScore(cognitiveScores);
  const testedCount = Object.values(cognitiveScores).filter((s) => s > 0).length;
  const isEmpty = testedCount === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xxxl,
          paddingHorizontal: Spacing.xl,
        }}
      >
        {/* Header */}
        <FadeInView delay={0}>
          <Eyebrow>Brain profile</Eyebrow>
          <SectionHeading size="lg">
            {isEmpty ? 'Measure your brainpower.' : `Brainpower, rising.`}
          </SectionHeading>
          <View style={{ height: 8 }} />
          <MutedText size="md">
            {isEmpty
              ? 'Play each game once to map your cognitive profile across 5 attributes - memory, recall, attention, speed, problem solving.'
              : `${testedCount} of 5 attributes tested. Put your brain back in charge.`}
          </MutedText>
        </FadeInView>

        <View style={{ height: Spacing.xl }} />

        {/* Overall hero - big composite score with halo */}
        <FadeInView delay={80}>
          <AnvilCard padding="xl">
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: -16,
                    width: 130,
                    height: 80,
                    borderRadius: 60,
                    backgroundColor: colors.accentGlow,
                    opacity: 0.55,
                  }}
                />
                <Text style={[styles.overallStat, { color: colors.accent }]}>
                  {isEmpty ? '-' : overall}
                </Text>
                <Text style={[styles.overallLabel, { color: colors.muted }]}>OVERALL</Text>
              </View>
              <View style={{ alignItems: 'flex-end', paddingTop: 6 }}>
                <View style={[styles.bandPill, {
                  backgroundColor: isEmpty ? colors.cardAlt : `${colors.accent}1A`,
                  borderColor: isEmpty ? colors.border : `${colors.accent}33`,
                }]}>
                  <Text style={[styles.bandText, { color: isEmpty ? colors.muted : colors.accent }]}>
                    {isEmpty ? 'NOT TESTED' : band(overall).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.gamesCount, { color: colors.muted }]}>
                  {progress.gamesPlayed} tests taken
                </Text>
              </View>
            </View>
          </AnvilCard>
        </FadeInView>

        {/* Attributes section */}
        <View style={styles.sectionLabelRow}>
          <Eyebrow style={{ marginBottom: 0 }}>Cognitive attributes</Eyebrow>
        </View>

        <FadeInView delay={140}>
          <AnvilCard padding="md">
            {ATTRIBUTES.map((meta, i) => (
              <AttributeRow
                key={meta.key}
                meta={meta}
                score={cognitiveScores[meta.key] ?? 0}
                isLast={i === ATTRIBUTES.length - 1}
              />
            ))}
          </AnvilCard>
        </FadeInView>

        {/* Coaching nudge - call out the weakest tested area, or the next
            untested one. Builds the "getting smarter" loop. */}
        {!isEmpty && (() => {
          const untested = ATTRIBUTES.find((a) => (cognitiveScores[a.key] ?? 0) === 0);
          const weakest = !untested
            ? [...ATTRIBUTES].sort((a, b) => (cognitiveScores[a.key] ?? 0) - (cognitiveScores[b.key] ?? 0))[0]
            : null;
          const target = untested ?? weakest;
          if (!target) return null;
          const isUntested = !!untested;
          return (
            <FadeInView delay={200}>
              <View style={{ height: Spacing.lg }} />
              <AnvilCard padding="lg">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.nudgeIcon, { backgroundColor: `${target.hue}1A`, borderColor: `${target.hue}40` }]}>
                    <Brain size={18} color={target.hue} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nudgeTitle, { color: colors.text }]}>
                      {isUntested ? `Test your ${target.label.toLowerCase()}` : `Train ${target.label.toLowerCase()} next`}
                    </Text>
                    <Text style={[styles.nudgeBody, { color: colors.muted }]}>
                      {isUntested
                        ? `Play ${target.source} to map this attribute.`
                        : `Your weakest area. ${target.source} pushes it up.`}
                    </Text>
                  </View>
                </View>
              </AnvilCard>
            </FadeInView>
          );
        })()}

        {/* Weekly chart - kept, demoted */}
        {!isEmpty && (
          <FadeInView delay={240}>
            <View style={styles.sectionLabelRow}>
              <Eyebrow style={{ marginBottom: 0 }}>This week</Eyebrow>
              <Text style={[styles.sectionCount, { color: colors.muted }]}>POINTS</Text>
            </View>
            <AnvilCard padding="lg">
              <WeeklyChart data={progress.weeklyPoints} />
            </AnvilCard>
          </FadeInView>
        )}

        {/* Empty state - show how it'll look once they play */}
        {isEmpty && (
          <FadeInView delay={140}>
            <View style={{ height: Spacing.lg }} />
            <View style={[styles.emptyHint, { borderColor: colors.border }]}>
              <Text style={[styles.emptyHintTitle, { color: colors.text }]}>
                Five short tests. Five measurements.
              </Text>
              <Text style={[styles.emptyHintBody, { color: colors.muted }]}>
                Each one is a real cognitive test - the same kind sports
                neurology clinics use. After one round of each, you'll have
                a baseline you can train.
              </Text>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
  },

  // Overall hero
  overallStat: {
    fontSize: 64,
    fontFamily: FontFamily.medium,
    letterSpacing: -2.2,
    lineHeight: 68,
  },
  overallLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    letterSpacing: 1.6,
    marginTop: 6,
  },
  bandPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  bandText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    letterSpacing: 1.2,
  },
  gamesCount: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 8,
  },

  // Attribute rows
  attrRow: {
    paddingVertical: 14,
  },
  attrTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  attrLabel: {
    fontSize: 17,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  attrBlurb: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  attrScore: {
    fontSize: 26,
    fontFamily: FontFamily.medium,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  attrTier: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    letterSpacing: 0.4,
    marginTop: -2,
  },
  attrBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  attrBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Coaching nudge
  nudgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
  },
  nudgeBody: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 3,
    lineHeight: 20,
  },

  // Weekly chart
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    gap: 6,
    paddingTop: 4,
  },
  chartCol: { flex: 1, alignItems: 'center', gap: 8 },
  chartTrack: {
    flex: 1,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  chartBar: { width: '100%', borderRadius: 4 },
  chartDay: { fontSize: 12, letterSpacing: 0.4 },

  // Empty hint
  emptyHint: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    borderStyle: 'dashed',
  },
  emptyHintTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  emptyHintBody: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
  },
});
