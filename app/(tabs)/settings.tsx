import { ScrollView, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Volume2, User, Sun, Moon, Smartphone, Check } from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import type { ThemeMode } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { progress, settings, updateSettings } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const toggleGame = (game: GameType) => {
    const enabled = settings.enabledGames.includes(game);
    if (enabled && settings.enabledGames.length <= 1) return;
    const next = enabled
      ? settings.enabledGames.filter((g) => g !== game)
      : [...settings.enabledGames, game];
    updateSettings({ enabledGames: next });
  };

  const setChallenges = (n: number) => {
    updateSettings({ challengesRequired: n });
  };

  const themeModes: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun size={16} color={colors.accent} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon size={16} color={colors.accent} /> },
    { mode: 'system', label: 'System', icon: <Smartphone size={16} color={colors.accent} /> },
  ];

  return (
    <YStack flex={1} backgroundColor={colors.background}>
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
          color={colors.text}
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
            colors={gradients.cardWarm}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 28, alignItems: 'center' }}
          >
            <YStack
              width={72}
              height={72}
              borderRadius={36}
              backgroundColor={colors.cardAlt}
              borderWidth={2}
              borderColor={colors.accentGlow}
              justifyContent="center"
              alignItems="center"
              marginBottom={14}
              shadowColor={isDark ? 'transparent' : colors.accent}
              shadowOffset={{ width: 0, height: 0 }}
              shadowOpacity={isDark ? 0 : 0.15}
              shadowRadius={16}
              elevation={isDark ? 0 : 6}
            >
              <User size={30} color={colors.accent} />
            </YStack>
            <Text color={colors.text} fontSize={22} fontWeight="700">
              Brain Athlete
            </Text>
            <Text color={colors.secondary} fontSize={14} marginTop={4}>
              {progress.gamesWon} challenges won
            </Text>
          </LinearGradient>
        </GlowCard>

        {/* Appearance */}
        <YStack marginBottom={28}>
          <SectionTitle title="Appearance" />
          <GlowCard padding={0}>
            {themeModes.map(({ mode, label, icon }, i) => {
              const active = (settings.theme ?? 'system') === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.7}
                  onPress={() => updateSettings({ theme: mode })}
                >
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={14}
                    paddingHorizontal={20}
                    borderBottomWidth={i < themeModes.length - 1 ? 1 : 0}
                    borderBottomColor={colors.border}
                    backgroundColor={active ? colors.accentLight : 'transparent'}
                  >
                    <XStack alignItems="center" gap={14}>
                      <IconBadge size={36}>{icon}</IconBadge>
                      <Text color={colors.text} fontSize={16} fontWeight="500">
                        {label}
                      </Text>
                    </XStack>
                    {active && <Check size={18} color={colors.accent} />}
                  </XStack>
                </TouchableOpacity>
              );
            })}
          </GlowCard>
        </YStack>

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
                  borderBottomColor={colors.border}
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
                    <Text color={colors.text} fontSize={16} fontWeight="500">
                      {game.title}
                    </Text>
                  </XStack>
                  <Switch
                    value={enabled}
                    onValueChange={() => toggleGame(key)}
                    trackColor={{ false: colors.border, true: 'rgba(245,166,35,0.35)' }}
                    thumbColor={enabled ? colors.accent : colors.muted}
                  />
                </XStack>
              );
            })}
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
                        colors={[colors.accent, colors.accentDark]}
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
                        backgroundColor={colors.cardAlt}
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={colors.border}
                      >
                        <Text color={colors.secondary} fontSize={14} fontWeight="600">
                          {n} game{n > 1 ? 's' : ''}
                        </Text>
                      </YStack>
                    )}
                  </TouchableOpacity>
                );
              })}
            </XStack>
            <Text color={colors.muted} fontSize={13}>
              Number of brain challenges required to unlock apps
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
              borderBottomColor={colors.border}
            >
              <XStack alignItems="center" gap={14}>
                <IconBadge size={36}>
                  <Zap size={16} color={colors.accent} />
                </IconBadge>
                <Text color={colors.text} fontSize={16} fontWeight="500">
                  Haptic Feedback
                </Text>
              </XStack>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={(v) => updateSettings({ hapticFeedback: v })}
                trackColor={{ false: colors.border, true: 'rgba(245,166,35,0.35)' }}
                thumbColor={settings.hapticFeedback ? colors.accent : colors.muted}
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
                  <Volume2 size={16} color={colors.accent} />
                </IconBadge>
                <Text color={colors.text} fontSize={16} fontWeight="500">
                  Sound Effects
                </Text>
              </XStack>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(v) => updateSettings({ soundEnabled: v })}
                trackColor={{ false: colors.border, true: 'rgba(245,166,35,0.35)' }}
                thumbColor={settings.soundEnabled ? colors.accent : colors.muted}
              />
            </XStack>
          </GlowCard>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
