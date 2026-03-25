import { useState, useRef } from 'react';
import { ScrollView, Switch, TouchableOpacity, TextInput, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Volume2, User, Sun, Moon, Smartphone, Check, Pencil, FileText, Shield } from 'lucide-react-native';
// LinearGradient still used for profile card gradient
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../src/store/useStore';
import { GAMES, GameType } from '../../src/constants/games';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { useThemeColors } from '../../src/hooks/useThemeColors';
import { hapticLight } from '../../src/utils/haptics';
import type { ThemeMode } from '../../src/constants/theme';

export default function ProfileScreen() {
  const { progress, settings, updateSettings, userName, setUserName } = useStore();
  const insets = useSafeAreaInsets();
  const { colors, isDark, gradients } = useThemeColors();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const nameInputRef = useRef<TextInput>(null);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
    } else {
      setNameInput(userName);
    }
    setEditingName(false);
  };

  const handleEditName = () => {
    setNameInput(userName);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const toggleGame = (game: GameType) => {
    const enabled = settings.enabledGames.includes(game);
    if (enabled && settings.enabledGames.length <= 1) return;
    const next = enabled
      ? settings.enabledGames.filter((g) => g !== game)
      : [...settings.enabledGames, game];
    updateSettings({ enabledGames: next });
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

        {/* Profile Card - green gradient */}
        <GlowCard elevated marginBottom={28} padding={0} overflow="hidden" borderWidth={0}>
          <LinearGradient
            colors={gradients.heroGreen}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 28, alignItems: 'center' }}
          >
            <YStack
              width={72}
              height={72}
              borderRadius={36}
              backgroundColor="rgba(255,255,255,0.15)"
              justifyContent="center"
              alignItems="center"
              marginBottom={14}
            >
              <User size={30} color="#FFFFFF" />
            </YStack>

            {editingName ? (
              <TextInput
                ref={nameInputRef}
                value={nameInput}
                onChangeText={setNameInput}
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                maxLength={24}
                autoFocus
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  paddingVertical: 4,
                  paddingHorizontal: 16,
                  minWidth: 120,
                  borderBottomWidth: 2,
                  borderBottomColor: 'rgba(255,255,255,0.5)',
                }}
                placeholderTextColor="rgba(255,255,255,0.5)"
                placeholder="Your name"
              />
            ) : (
              <TouchableOpacity
                onPress={handleEditName}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Text color="#FFFFFF" fontSize={22} fontWeight="700">
                  {userName || 'Tap to set name'}
                </Text>
                <Pencil size={14} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            )}

            <Text color="rgba(255,255,255,0.6)" fontSize={14} marginTop={4}>
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
                      borderRadius={18}
                      backgroundColor={`${game.color}15`}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <View
                        width={16}
                        height={16}
                        borderRadius={8}
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
                    trackColor={{ false: colors.border, true: 'rgba(232,133,12,0.35)' }}
                    thumbColor={enabled ? colors.accent : colors.muted}
                  />
                </XStack>
              );
            })}
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
                trackColor={{ false: colors.border, true: 'rgba(232,133,12,0.35)' }}
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
                trackColor={{ false: colors.border, true: 'rgba(232,133,12,0.35)' }}
                thumbColor={settings.soundEnabled ? colors.accent : colors.muted}
              />
            </XStack>
          </GlowCard>
        </YStack>

        {/* Legal */}
        <YStack marginBottom={28}>
          <SectionTitle title="Legal" />
          <GlowCard padding={0}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://plbtk.com/terms')}
            >
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
                    <FileText size={16} color={colors.accent} />
                  </IconBadge>
                  <Text color={colors.text} fontSize={16} fontWeight="500">
                    Terms of Use
                  </Text>
                </XStack>
              </XStack>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://plbtk.com/privacy')}
            >
              <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingVertical={14}
                paddingHorizontal={20}
              >
                <XStack alignItems="center" gap={14}>
                  <IconBadge size={36}>
                    <Shield size={16} color={colors.accent} />
                  </IconBadge>
                  <Text color={colors.text} fontSize={16} fontWeight="500">
                    Privacy Policy
                  </Text>
                </XStack>
              </XStack>
            </TouchableOpacity>
          </GlowCard>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
