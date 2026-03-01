import { Text, XStack } from 'tamagui';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface GoldButtonProps {
  children: ReactNode;
  onPress: () => void;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function GoldButton({
  children,
  onPress,
  icon,
  size = 'md',
  disabled = false,
  style,
  fullWidth = false,
}: GoldButtonProps) {
  const { isDark } = useThemeColors();
  const height = size === 'sm' ? 36 : size === 'md' ? 48 : 56;
  const px = size === 'sm' ? 16 : size === 'md' ? 24 : 28;
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 17;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          borderRadius: 999,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          shadowColor: '#F5A623',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.15 : 0.3,
          shadowRadius: 16,
          elevation: isDark ? 2 : 8,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={['#F5A623', '#FF6B35']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height,
          paddingHorizontal: px,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Text color="#FFFFFF" fontSize={fontSize} fontWeight="700">
          {children}
        </Text>
        {icon}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({
  children,
  onPress,
  icon,
  disabled = false,
  style,
}: Omit<GoldButtonProps, 'size' | 'fullWidth'>) {
  const { colors } = useThemeColors();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          height: 48,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(245,166,35,0.25)',
          backgroundColor: 'rgba(245,166,35,0.06)',
          paddingHorizontal: 24,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon}
      <Text color={colors.text} fontSize={15} fontWeight="600">
        {children}
      </Text>
    </TouchableOpacity>
  );
}
