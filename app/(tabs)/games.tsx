import { TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronRight, Calculator, Grid3x3, Sparkles, Type, BookOpen, Zap, Palette,
} from 'lucide-react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GAMES, GameType, CATEGORIES, GameCategory } from '../../src/constants/games';
import { hapticLight } from '../../src/utils/haptics';
import { GlowCard } from '../../src/components/ui/GlowCard';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { FadeInView } from '../../src/components/ui/AnimatedElements';

const LIGHT_BG = '#F8F9FB';

const GAME_ICONS: Record<GameType, (s: number, c: string) => React.ReactNode> = {
  math: (s, c) => <Calculator size={s} color={c} />,
  memory: (s, c) => <Grid3x3 size={s} color={c} />,
  pattern: (s, c) => <Sparkles size={s} color={c} />,
  wordscramble: (s, c) => <Type size={s} color={c} />,
  speedread: (s, c) => <BookOpen size={s} color={c} />,
  reaction: (s, c) => <Zap size={s} color={c} />,
  colormatch: (s, c) => <Palette size={s} color={c} />,
};

export default function GamesScreen() {
  const insets = useSafeAreaInsets();

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
        <FadeInView delay={0}>
          <Text
            color="#1A1A2E"
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
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.85}
                    onPress={() => handlePlayGame(key)}
                  >
                    <GlowCard marginBottom={10} interactive>
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
                          <Text color="#1A1A2E" fontSize={16} fontWeight="600" marginBottom={3}>
                            {game.title}
                          </Text>
                          <Text color="#9CA3AF" fontSize={13}>
                            {game.description}
                          </Text>
                        </YStack>
                        <ChevronRight size={18} color="#D1D5DB" />
                      </XStack>
                    </GlowCard>
                  </TouchableOpacity>
                );
              })}
            </YStack>
          </FadeInView>
        ))}
      </ScrollView>
    </YStack>
  );
}
