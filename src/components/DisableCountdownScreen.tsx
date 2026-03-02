import { TouchableOpacity } from 'react-native';
import { YStack, Text, View } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { PulsingIcon } from './ui/AnimatedElements';

interface DisableCountdownScreenProps {
  remainingSeconds: number;
  totalSeconds: number;
  onCancel: () => void;
}

export default function DisableCountdownScreen({
  remainingSeconds,
  totalSeconds,
  onCancel,
}: DisableCountdownScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <YStack
      flex={1}
      backgroundColor={colors.background}
      paddingTop={insets.top + 20}
      paddingBottom={insets.bottom + 20}
      paddingHorizontal={20}
      justifyContent="center"
      alignItems="center"
    >
      {/* Pulsing shield icon */}
      <PulsingIcon size={72}>
        <Shield size={32} color="#FFFFFF" />
      </PulsingIcon>

      <Text
        color={colors.text}
        fontSize={20}
        fontWeight="700"
        marginTop={32}
        marginBottom={8}
      >
        Waiting to Disable
      </Text>

      <Text
        color={colors.secondary}
        fontSize={15}
        textAlign="center"
        marginBottom={40}
        paddingHorizontal={20}
      >
        Take a moment to think.{'\n'}Do you really want to disable app blocking?
      </Text>

      {/* Large countdown */}
      <Text
        color={colors.accent}
        fontSize={64}
        fontWeight="800"
        letterSpacing={-2}
      >
        {timeString}
      </Text>

      <Text color={colors.muted} fontSize={13} marginTop={8} marginBottom={32}>
        remaining
      </Text>

      {/* Progress bar */}
      <View
        width="80%"
        height={6}
        borderRadius={3}
        overflow="hidden"
        backgroundColor={
          isDark ? 'rgba(245,166,35,0.08)' : 'rgba(245,166,35,0.12)'
        }
      >
        <LinearGradient
          colors={[colors.accent, colors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            borderRadius: 3,
          }}
        />
      </View>

      {/* Cancel button — subtle, at bottom */}
      <TouchableOpacity
        onPress={onCancel}
        activeOpacity={0.7}
        style={{ marginTop: 'auto', paddingVertical: 16 }}
      >
        <Text color={colors.muted} fontSize={15} fontWeight="500">
          Cancel
        </Text>
      </TouchableOpacity>
    </YStack>
  );
}
