import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { YStack, XStack, Text, View } from 'tamagui';
import { useThemeColors } from '../../hooks/useThemeColors';
import { hapticLight } from '../../utils/haptics';

const { height: SCREEN_H } = Dimensions.get('window');
const ITEM_H = 52;
const VISIBLE_ITEMS = 5;
const WHEEL_H = ITEM_H * VISIBLE_ITEMS;
const formatHour = (h: number) => {
  if (h === 24) return '12:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
};

interface TimePickerSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: number;
  onChange: (hour: number) => void;
  onClose: () => void;
  maxHour?: number; // 23 for start time, 24 for end time (24 = midnight next day)
}

export function TimePickerSheet({
  visible,
  title,
  subtitle,
  value,
  onChange,
  onClose,
  maxHour = 23,
}: TimePickerSheetProps) {
  const { colors, isDark } = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalValue(value);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: value * ITEM_H, animated: false });
      }, 50);
    }
  }, [visible, value]);

  const handleDone = () => {
    onChange(localValue);
    onClose();
  };

  const sheetBg = isDark ? '#1A1A24' : '#FFFFFF';
  const handleColor = isDark ? '#3A3A44' : '#D1D5DB';

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.duration(350).damping(20).stiffness(140)}
          exiting={SlideOutDown.duration(250)}
          style={{
            backgroundColor: sheetBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Handle bar */}
          <YStack alignItems="center" paddingTop={12} paddingBottom={8}>
            <View
              width={36}
              height={4}
              borderRadius={2}
              backgroundColor={handleColor}
            />
          </YStack>

          {/* Title */}
          <YStack alignItems="center" paddingHorizontal={24} paddingBottom={24}>
            <Text color={colors.text} fontSize={20} fontWeight="700" marginBottom={6}>
              {title}
            </Text>
            {subtitle && (
              <Text color={colors.muted} fontSize={14}>
                {subtitle}
              </Text>
            )}
          </YStack>

          {/* Scroll wheel */}
          <YStack alignItems="center" paddingHorizontal={24}>
            <View style={{ height: WHEEL_H, width: '100%', overflow: 'hidden' }}>
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
                  const clamped = Math.max(0, Math.min(maxHour, idx));
                  if (clamped !== localValue) {
                    hapticLight();
                    setLocalValue(clamped);
                  }
                }}
              >
                {Array.from({ length: maxHour + 1 }, (_, i) => i).map((h) => {
                  const isSelected = h === localValue;
                  return (
                    <View
                      key={h}
                      style={{
                        height: ITEM_H,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        color={isSelected ? colors.text : colors.muted}
                        fontSize={isSelected ? 24 : 18}
                        fontWeight={isSelected ? '700' : '400'}
                        opacity={isSelected ? 1 : 0.5}
                      >
                        {formatHour(h)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Selection highlight band */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: ITEM_H * 2,
                  left: 0,
                  right: 0,
                  height: ITEM_H,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? 'rgba(232,133,12,0.08)'
                    : 'rgba(232,133,12,0.06)',
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(232,133,12,0.15)'
                    : 'rgba(232,133,12,0.12)',
                }}
              />
            </View>
          </YStack>

          {/* Done button */}
          <YStack alignItems="center" paddingTop={28} paddingHorizontal={24}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDone}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 48,
                borderRadius: 999,
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.15 : 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text color="#FFFFFF" fontSize={16} fontWeight="700">
                Done
              </Text>
            </TouchableOpacity>
          </YStack>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
