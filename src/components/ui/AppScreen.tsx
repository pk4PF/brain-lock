import { ScrollView } from 'react-native';
import { YStack } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}

export function AppScreen({ children, scroll = true, padded = true }: AppScreenProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <YStack
      flex={1}
      backgroundColor="#0A0A0F"
      paddingTop={insets.top}
      paddingBottom={insets.bottom}
      paddingHorizontal={padded ? 20 : 0}
    >
      {children}
    </YStack>
  );

  if (scroll) {
    return (
      <YStack flex={1} backgroundColor="#0A0A0F">
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: padded ? 20 : 0,
          }}
        >
          {children}
        </ScrollView>
      </YStack>
    );
  }

  return content;
}
