import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface OnboardingBackButtonProps {
    onPress?: () => void;
}

/**
 * The back chevron used on every onboarding screen.
 *
 * Sits *below* the progress bar (not on top of it) so the two never
 * visually collide. Uses a soft circular card-tinted background so the
 * arrow reads clearly against any onboarding hero.
 */
export default function OnboardingBackButton({ onPress }: OnboardingBackButtonProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useThemeColors();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.back();
        }
    };

    return (
        <TouchableOpacity
            // The progress block now contains a STEP X OF Y label (~19pt)
            // above a 6pt track, plus the OnboardingLayout's insets.top + 6
            // top padding. Total stack bottoms out around insets.top + 47;
            // sit at +60 to leave a clean gap.
            style={[
                styles.button,
                {
                    top: insets.top + 60,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.12,
                            shadowRadius: 4,
                        },
                        android: { elevation: 2 },
                    }),
                },
            ]}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2.4} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
