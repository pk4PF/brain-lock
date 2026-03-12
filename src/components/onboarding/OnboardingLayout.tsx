import { ReactNode } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface OnboardingLayoutProps {
    children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
    return (
        <View style={styles.container}>
            {/* Warm ambient orbs */}
            <View style={styles.glowOrb1} />
            <View style={styles.glowOrb2} />
            <View style={styles.glowOrb3} />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    glowOrb1: {
        position: 'absolute',
        top: -40,
        left: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(232,133,12,0.06)',
    },
    glowOrb2: {
        position: 'absolute',
        bottom: height * 0.12,
        right: -80,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(232,133,12,0.05)',
    },
    glowOrb3: {
        position: 'absolute',
        top: height * 0.4,
        left: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,107,53,0.03)',
    },
});
