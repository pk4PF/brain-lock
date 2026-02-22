import { ScrollView, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Volume2, User, ChevronRight, Clock, Minus, Plus } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType, Difficulty, DIFFICULTY_CONFIG } from '../../src/constants/games';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { IconBadge } from '../../src/components/ui/IconBadge';

const AMBER = '#F5A623';
const AMBER_DARK = '#FF6B35';
const LIGHT_BG = '#F8F9FB';
const BORDER = '#E5E7EB';

export default function ProfileScreen() {
  const { progress, settings, updateSettings } = useStore();
  const insets = useSafeAreaInsets();

  const toggleGame = (game: GameType) => {
    const enabled = settings.enabledGames.includes(game);
    if (enabled && settings.enabledGames.length <= 1) return;
    const next = enabled
      ? settings.enabledGames.filter((g) => g !== game)
      : [...settings.enabledGames, game];
    updateSettings({ enabledGames: next });
  };

  const setDifficulty = (d: Difficulty) => {
    updateSettings({ difficulty: d });
  };

  const setChallenges = (n: number) => {
    updateSettings({ challengesRequired: n });
  };

  return (
    <YStack flex={1} backgroundColor={LIGHT_BG}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
        }}
      >
        {/* Header */}
        <Text
          color="#1A1A2E"
          fontSize={28}
          fontWeight="700"
          letterSpacing={-0.5}
          marginBottom={24}
        >
          Profile
        </Text>

        {/* Profile Card */}
        <GlowCard accent elevated marginBottom={28} padding={0} overflow="hidden">
          <LinearGradient
            colors={['#FFFFFF', '#FFF8EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 28, alignItems: 'center' }}
          >
            <YStack
              width={72}
              height={72}
              borderRadius={36}
              backgroundColor="#F0F1F5"
              borderWidth={2}
              borderColor="rgba(245,166,35,0.25)"
              justifyContent="center"
              alignItems="center"
              marginBottom={14}
              shadowColor={AMBER}
              shadowOffset={{ width: 0, height: 0 }}
              shadowOpacity={0.15}
              shadowRadius={16}
              elevation={6}
            >
              <User size={30} color={AMBER} />
            </YStack>
            <Text color="#1A1A2E" fontSize={22} fontWeight="700">
              Brain Athlete
            </Text>
            <Text color="#6B7280" fontSize={14} marginTop={4}>
              {progress.gamesWon} challenges won
            </Text>
          </LinearGradient>
        </GlowCard>

        {/* Game Types */}
        <YStack marginBottom={28}>
          <SectionTitle title="Game Types" />
          <GlowCard padding={0}>
            {(Object.keys(GAMES) as GameType[]).map((key, i, arr) => {
              const game = GAMES[key];
              const enabled = settings.enabledGames.includes(key);
              return (
                <XStack
                  key={key}
                  alignItems="center"
                  justifyContent="space-between"
                  paddingVertical={14}
                  paddingHorizontal={20}
                  borderBottomWidth={i < arr.length - 1 ? 1 : 0}
                  borderBottomColor={BORDER}
                >
                  <XStack alignItems="center" gap={14}>
                    <YStack
                      width={36}
                      height={36}
                      borderRadius={10}
                      backgroundColor={`${game.color}12`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <View
                        width={16}
                        height={16}
                        borderRadius={5}
                        backgroundColor={`${game.color}40`}
                      />
                    </YStack>
                    <Text color="#1A1A2E" fontSize={16} fontWeight="500">
                      {game.title}
                    </Text>
                  </XStack>
                  <Switch
                    value={enabled}
                    onValueChange={() => toggleGame(key)}
                    trackColor={{ false: '#E5E7EB', true: 'rgba(245,166,35,0.35)' }}
                    thumbColor={enabled ? AMBER : '#D1D5DB'}
                  />
                </XStack>
              );
            })}
          </GlowCard>
        </YStack>

        {/* Difficulty */}
        <YStack marginBottom={28}>
          <SectionTitle title="Difficulty" />
          <GlowCard>
            <XStack gap={8} marginBottom={14}>
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
                const active = settings.difficulty === d;
                return (
                  <TouchableOpacity
                    key={d}
                    activeOpacity={0.8}
                    onPress={() => setDifficulty(d)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[AMBER, AMBER_DARK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          borderRadius: 12,
                        }}
                      >
                        <Text color="#FFFFFF" fontSize={14} fontWeight="700">
                          {DIFFICULTY_CONFIG[d].label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <YStack
                        paddingVertical={12}
                        alignItems="center"
                        backgroundColor="#F0F1F5"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={BORDER}
                      >
                        <Text color="#6B7280" fontSize={14} fontWeight="600">
                          {DIFFICULTY_CONFIG[d].label}
                        </Text>
                      </YStack>
                    )}
                  </TouchableOpacity>
                );
              })}
            </XStack>
            <Text color="#9CA3AF" fontSize={13}>
              {settings.difficulty === 'easy'
                ? 'Relaxed pace, simpler problems'
                : settings.difficulty === 'medium'
                  ? 'Balanced challenge for daily training'
                  : 'Maximum brain power required'}
            </Text>
          </GlowCard>
        </YStack>

        {/* Challenges Required */}
        <YStack marginBottom={28}>
          <SectionTitle title="Challenges to Unlock" />
          <GlowCard>
            <XStack gap={8} marginBottom={14}>
              {[1, 2, 3].map((n) => {
                const active = settings.challengesRequired === n;
                return (
                  <TouchableOpacity
                    key={n}
                    activeOpacity={0.8}
                    onPress={() => setChallenges(n)}
                    style={{
                      flex: 1,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {active ? (
                      <LinearGradient
                        colors={[AMBER, AMBER_DARK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          paddingVertical: 12,
                          alignItems: 'center',
                          borderRadius: 12,
                        }}
                      >
                        <Text color="#FFFFFF" fontSize={14} fontWeight="700">
                          {n} game{n > 1 ? 's' : ''}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <YStack
                        paddingVertical={12}
                        alignItems="center"
                        backgroundColor="#F0F1F5"
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={BORDER}
                      >
                        <Text color="#6B7280" fontSize={14} fontWeight="600">
                          {n} game{n > 1 ? 's' : ''}
                        </Text>
                      </YStack>
                    )}
                  </TouchableOpacity>
                );
              })}
            </XStack>
            <Text color="#9CA3AF" fontSize={13}>
              Number of brain challenges required to unlock apps
            </Text>
          </GlowCard>
        </YStack>

        {/* Active Hours */}
        <YStack marginBottom={28}>
          <SectionTitle title="Active Hours" />
          <GlowCard>
            <XStack gap={16}>
              <YStack flex={1} alignItems="center" gap={8}>
                <Text color="#6B7280" fontSize={12} fontWeight="600" textTransform="uppercase" letterSpacing={1}>
                  From
                </Text>
                <XStack alignItems="center" gap={12}>
                  <TouchableOpacity
                    onPress={() => updateSettings({ activeHoursStart: Math.max(0, settings.activeHoursStart - 1) })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F0F1F5',
                      borderWidth: 1,
                      borderColor: BORDER,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Minus size={14} color="#6B7280" />
                  </TouchableOpacity>
                  <Text color="#1A1A2E" fontSize={18} fontWeight="700" width={60} textAlign="center">
                    {settings.activeHoursStart.toString().padStart(2, '0')}:00
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateSettings({ activeHoursStart: Math.min(23, settings.activeHoursStart + 1) })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F0F1F5',
                      borderWidth: 1,
                      borderColor: BORDER,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Plus size={14} color="#6B7280" />
                  </TouchableOpacity>
                </XStack>
              </YStack>
              <YStack flex={1} alignItems="center" gap={8}>
                <Text color="#6B7280" fontSize={12} fontWeight="600" textTransform="uppercase" letterSpacing={1}>
                  To
                </Text>
                <XStack alignItems="center" gap={12}>
                  <TouchableOpacity
                    onPress={() => updateSettings({ activeHoursEnd: Math.max(0, settings.activeHoursEnd - 1) })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F0F1F5',
                      borderWidth: 1,
                      borderColor: BORDER,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Minus size={14} color="#6B7280" />
                  </TouchableOpacity>
                  <Text color="#1A1A2E" fontSize={18} fontWeight="700" width={60} textAlign="center">
                    {settings.activeHoursEnd.toString().padStart(2, '0')}:00
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateSettings({ activeHoursEnd: Math.min(23, settings.activeHoursEnd + 1) })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: '#F0F1F5',
                      borderWidth: 1,
                      borderColor: BORDER,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Plus size={14} color="#6B7280" />
                  </TouchableOpacity>
                </XStack>
              </YStack>
            </XStack>
            <Text color="#9CA3AF" fontSize={13} marginTop={14} textAlign="center">
              App locking is only active during these hours
            </Text>
          </GlowCard>
        </YStack>

        {/* Preferences */}
        <YStack marginBottom={28}>
          <SectionTitle title="Preferences" />
          <GlowCard padding={0}>
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingVertical={14}
              paddingHorizontal={20}
              borderBottomWidth={1}
              borderBottomColor={BORDER}
            >
              <XStack alignItems="center" gap={14}>
                <IconBadge size={36}>
                  <Zap size={16} color={AMBER} />
                </IconBadge>
                <Text color="#1A1A2E" fontSize={16} fontWeight="500">
                  Haptic Feedback
                </Text>
              </XStack>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(v) => updateSettings({ hapticFeedback: v })}
                trackColor={{ false: '#E5E7EB', true: 'rgba(245,166,35,0.35)' }}
                thumbColor={settings.hapticFeedback ? AMBER : '#D1D5DB'}
              />
            </XStack>
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingVertical={14}
              paddingHorizontal={20}
            >
              <XStack alignItems="center" gap={14}>
                <IconBadge size={36}>
                  <Volume2 size={16} color={AMBER} />
                </IconBadge>
                <Text color="#1A1A2E" fontSize={16} fontWeight="500">
                  Sound Effects
                </Text>
              </XStack>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                trackColor={{ false: '#E5E7EB', true: 'rgba(245,166,35,0.35)' }}
                thumbColor={settings.soundEnabled ? AMBER : '#D1D5DB'}
              />
            </XStack>
          </GlowCard>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
