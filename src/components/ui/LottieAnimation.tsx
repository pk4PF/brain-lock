import { useRef, useEffect } from 'react';
import { ViewStyle, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

// Animation sources - centralized for easy swapping
export const ANIMATIONS = {
    brain: require('../../../assets/animations/brain.json'),
    confetti: require('../../../assets/animations/confetti.json'),
    success: require('../../../assets/animations/success.json'),
    lock: require('../../../assets/animations/lock.json'),
    rocket: require('../../../assets/animations/rocket.json'),
    sparkle: require('../../../assets/animations/sparkle.json'),
    flame: require('../../../assets/animations/flame.json'),
    chart: require('../../../assets/animations/chart.json'),
} as const;

export type AnimationName = keyof typeof ANIMATIONS;

interface LottieAnimationProps {
    /** Name of a built-in animation or a custom source */
    name?: AnimationName;
    /** Custom animation source (overrides name) */
    source?: any;
    /** Width & height of the animation */
    size?: number;
    /** Auto-play on mount (default: true) */
    autoPlay?: boolean;
    /** Loop the animation (default: true) */
    loop?: boolean;
    /** Playback speed (default: 1) */
    speed?: number;
    /** Additional container styles */
    style?: ViewStyle;
    /** Callback when animation finishes (only fires if loop=false) */
    onFinish?: () => void;
}

export default function LottieAnimation({
    name,
    source,
    size = 200,
    autoPlay = true,
    loop = true,
    speed = 1,
    style,
    onFinish,
}: LottieAnimationProps) {
    const animationRef = useRef<LottieView>(null);

    const animSource = source || (name ? ANIMATIONS[name] : undefined);

    if (!animSource) {
        return null;
    }

    return (
        <View style={[{ width: size, height: size }, style]}>
            <LottieView
                ref={animationRef}
                source={animSource}
                autoPlay={autoPlay}
                loop={loop}
                speed={speed}
                style={{ width: size, height: size }}
                onAnimationFinish={onFinish}
            />
        </View>
    );
}
