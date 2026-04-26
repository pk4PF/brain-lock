import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const { height } = Dimensions.get('window');

interface OnboardingLayoutProps {
    children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
    const { colors, isDark } = useThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Warm ambient orbs */}
            <View style={[styles.glowOrb1, { backgroundColor: isDark ? 'rgba(255,213,79,0.04)' : 'rgba(245,166,35,0.06)' }]} />
            <View style={[styles.glowOrb2, { backgroundColor: isDark ? 'rgba(255,213,79,0.03)' : 'rgba(245,166,35,0.05)' }]} />
            <View style={[styles.glowOrb3, { backgroundColor: isDark ? 'rgba(255,107,53,0.02)' : 'rgba(255,107,53,0.03)' }]} />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
