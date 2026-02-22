import { TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

interface OnboardingBackButtonProps {
    onPress?: () => void;
}

export default function OnboardingBackButton({ onPress }: OnboardingBackButtonProps) {
    const insets = useSafeAreaInsets();

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.back();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, { top: insets.top + 8 }]}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
            <ArrowLeft size={24} color="#1A1A2E" strokeWidth={2} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
