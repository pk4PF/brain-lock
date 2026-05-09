import { useRef, useEffect } from 'react';
import LottieView, { AnimationObject } from 'lottie-react-native';
import { View, ViewStyle } from 'react-native';

export type LottieName =
  | 'brain'
  | 'brain-yellow'
  | 'lock'
  | 'sparkle'
  | 'success'
  | 'confetti'
  | 'flame'
  | 'chart'
  | 'rocket';

const SOURCES: Record<LottieName, AnimationObject> = {
  brain: require('../../assets/animations/brain.json'),
  'brain-yellow': require('../../assets/animations/brain-yellow.json'),
  lock: require('../../assets/animations/lock.json'),
  sparkle: require('../../assets/animations/sparkle.json'),
  success: require('../../assets/animations/success.json'),
  confetti: require('../../assets/animations/confetti.json'),
  flame: require('../../assets/animations/flame.json'),
  chart: require('../../assets/animations/chart.json'),
  rocket: require('../../assets/animations/rocket.json'),
};

interface Props {
  name: LottieName;
  size?: number;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  style?: ViewStyle;
}

/**
 * Drop-in replacement for hero-sized Lucide icons. Renders a Lottie animation
 * inside a square box; consumers pass the size and we square the bounds for
 * predictable layout (Lottie SVGs preserve aspect by default and any padding
 * comes from the source JSON).
 */
export default function LottieIcon({
  name,
  size = 96,
  loop = true,
  autoPlay = true,
  speed = 1,
  style,
}: Props) {
  const ref = useRef<LottieView>(null);

  // Some lottie-react-native + Reanimated combinations skip the initial
  // autoPlay frame on iOS until the component is interacted with. Calling
  // play() once on mount is a no-op when autoPlay already kicked in and a
  // safety net otherwise.
  useEffect(() => {
    if (autoPlay) ref.current?.play();
  }, [autoPlay]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LottieView
        ref={ref}
        source={SOURCES[name]}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
