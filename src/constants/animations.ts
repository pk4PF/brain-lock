import { WithSpringConfig } from 'react-native-reanimated';

// Reanimated spring configs
export const SPRING_ENTRY: WithSpringConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.8,
};

export const SPRING_BOUNCY: WithSpringConfig = {
  damping: 12,
  stiffness: 180,
  mass: 0.6,
};

// RN Animated spring config (for legacy Animated API)
export const ANIMATED_SPRING = {
  friction: 8,
  tension: 60,
  useNativeDriver: true,
};

// Transition durations (ms)
export const TRANSITION_FAST = 150;
export const TRANSITION_NORMAL = 200;
export const TRANSITION_SLOW = 300;

// Press feedback
export const PRESS_SCALE = 0.97;
export const PRESS_OPACITY = 0.7;
