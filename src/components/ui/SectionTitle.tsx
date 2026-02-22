import { XStack, Text } from 'tamagui';
import { TouchableOpacity } from 'react-native';

interface SectionTitleProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, actionText, onAction }: SectionTitleProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center" marginBottom={14}>
      <Text color="#1A1A2E" fontSize={20} fontWeight="600" letterSpacing={-0.3}>
        {title}
      </Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text color="#F5A623" fontSize={14} fontWeight="600">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </XStack>
  );
}
