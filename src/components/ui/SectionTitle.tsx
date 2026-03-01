import { XStack, Text } from 'tamagui';
import { TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface SectionTitleProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, actionText, onAction }: SectionTitleProps) {
  const { colors } = useThemeColors();

  return (
    <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
      <Text color={colors.text} fontSize={20} fontWeight="600" letterSpacing={-0.3}>
        {title}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text color={colors.accent} fontSize={14} fontWeight="600">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </XStack>
  );
}
