import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';
import { hapticLight } from '../../utils/haptics';
import { FontFamily } from '../../constants/theme';

export interface ChipOption {
    value: string;
    label: string;
    /**
     * @deprecated Emojis introduce chromatic noise. Prefer label-only chips
     *  to keep the onboarding palette monochrome + accent. Existing usages
     *  ignore this field; the prop survives for type-compat only.
     */
    emoji?: string;
}

interface ChipGroupProps {
    options: ChipOption[];
    selected: string[];
    onChange: (next: string[]) => void;
    multi?: boolean;
}

/**
 * Multi-select chip picker for onboarding "qualifying" screens
 * (struggles, goals, etc.). Each chip pops on press and shows a check
 * tick when selected. Set `multi={false}` for single-select.
 */
export default function ChipGroup({ options, selected, onChange, multi = true }: ChipGroupProps) {
    return (
        <View style={styles.row}>
            {options.map((opt) => (
                <Chip
                    key={opt.value}
                    option={opt}
                    selected={selected.includes(opt.value)}
                    onPress={() => {
                        hapticLight();
                        if (multi) {
                            onChange(
                                selected.includes(opt.value)
                                    ? selected.filter((v) => v !== opt.value)
                                    : [...selected, opt.value],
                            );
                        } else {
                            onChange([opt.value]);
                        }
                    }}
                />
            ))}
        </View>
    );
}

function Chip({
    option,
    selected,
    onPress,
}: {
    option: ChipOption;
    selected: boolean;
    onPress: () => void;
}) {
    const { colors, isDark } = useThemeColors();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
        }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const bg = selected
        ? colors.accentLight
        : isDark
            ? colors.card
            : '#FFFFFF';
    const border = selected ? colors.accent : colors.border;
    const textColor = selected ? colors.accent : colors.text;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.chip,
                    {
                        backgroundColor: bg,
                        borderColor: border,
                        borderWidth: selected ? 1.5 : 1,
                        transform: [{ scale }],
                    },
                ]}
            >
                <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
                    {option.label}
                </Text>
                {selected && (
                    <View style={[styles.check, { backgroundColor: colors.accent }]}>
                        <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 999,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontFamily: FontFamily.medium,
        letterSpacing: -0.1,
    },
    check: {
        marginLeft: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
