import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import OnboardingProgress from './OnboardingProgress';

const { height } = Dimensions.get('window');

interface OnboardingLayoutProps {
    children: ReactNode;
    /** Current step index (1-based) for the top progress bar. Omit to hide bar. */
    step?: number;
    /** Total step count for the progress bar. Defaults to 18 (matches the full flow). */
    totalSteps?: number;
}

export default function OnboardingLayout({ children, step, totalSteps = 18 }: OnboardingLayoutProps) {
    const { colors } = useThemeColors();
    const insets = useSafeAreaInsets();
    const showProgress = typeof step === 'number';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Warm ambient orbs - pulled from theme accent so they track
                the rest of the app, not a stale brand red. */}
            <View pointerEvents="none" style={[styles.glowOrb1, { backgroundColor: colors.accentLight }]} />
            <View pointerEvents="none" style={[styles.glowOrb2, { backgroundColor: colors.accentGlow }]} />
            <View pointerEvents="none" style={[styles.glowOrb3, { backgroundColor: colors.accentLight }]} />

            {showProgress && (
                <View style={[styles.progressWrap, { paddingTop: insets.top + 6 }]}>
                    <OnboardingProgress currentStep={step!} totalSteps={totalSteps} />
                </View>
            )}

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressWrap: {
        // Sits above all content but below back button (which uses absolute positioning).
    },
    glowOrb1: {
        position: 'absolute',
        top: -40,
        left: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    glowOrb2: {
        position: 'absolute',
        bottom: height * 0.12,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    glowOrb3: {
        position: 'absolute',
        top: height * 0.4,
        left: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
    },
});
