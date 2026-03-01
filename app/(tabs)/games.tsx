import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight, Calculator, Grid3x3, Type, BookOpen, Zap, Palette,
} from 'lucide-react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAMES, GameType, CATEGORIES, GameCategory } from '../../src/constants/games';
import { hapticLight } from '../../src/utils/haptics';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { FadeInView } from '../../src/components/ui/AnimatedElements';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const GAME_ICONS: Record<GameType, (s: number, c: string) => React.ReactNode> = {
  math: (s, c) => <Calculator size={s} color={c} />,
  memory: (s, c) => <Grid3x3 size={s} color={c} />,
  wordscramble: (s, c) => <Type size={s} color={c} />,
  speedread: (s, c) => <BookOpen size={s} color={c} />,
  reaction: (s, c) => <Zap size={s} color={c} />,
  colormatch: (s, c) => <Palette size={s} color={c} />,
};

export default function GamesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  const handlePlayGame = (key: GameType) => {
    hapticLight();
    router.push(`/games/${key}`);
  };

  const gamesByCategory = (Object.keys(CATEGORIES) as GameCategory[]).map((cat) => ({
    category: cat,
    label: CATEGORIES[cat].label,
    games: (Object.keys(GAMES) as GameType[]).filter((g) => GAMES[g].category === cat),
  }));

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
        <FadeInView delay={0}>
          <Text
            color={colors.text}
            fontSize={28}
            fontWeight="700"
            letterSpacing={-0.5}
            marginBottom={24}
          >
            Games
          </Text>
        </FadeInView>

        {gamesByCategory.map((section, sIdx) => (
          <FadeInView key={section.category} delay={100 + sIdx * 150}>
            <YStack marginBottom={28}>
              <SectionTitle title={section.label} />
              {section.games.map((key) => {
                const game = GAMES[key];
                return (
                  <GlowCard
                    key={key}
                    marginBottom={10}
                    interactive
                    onPress={() => handlePlayGame(key)}
                  >
                    <XStack alignItems="center" gap={16}>
                      <YStack
                        width={48}
                        height={48}
                        borderRadius={16}
                        backgroundColor={`${game.color}12`}
                        borderWidth={1}
                        borderColor={`${game.color}25`}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {GAME_ICONS[key](22, game.color)}
                      </YStack>
                      <YStack flex={1}>
                        <Text color={colors.text} fontSize={16} fontWeight="600" marginBottom={3}>
                          {game.title}
                        </Text>
                        <Text color={colors.muted} fontSize={13}>
                          {game.description}
                        </Text>
                      </YStack>
                      <ChevronRight size={18} color={colors.border} />
                    </XStack>
                  </GlowCard>
                );
              })}
            </YStack>
          </FadeInView>
        ))}
      </ScrollView>
    </YStack>
  );
}
