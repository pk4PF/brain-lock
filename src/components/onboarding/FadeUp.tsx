import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, AccessibilityInfo, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: ReactNode;
  /** ms to wait before starting. Use to stagger sibling FadeUps. */
  delay?: number;
  /** Total entrance duration. Defaults to 520ms - slow enough to read as
   *  intentional, fast enough not to feel laggy. */
  duration?: number;
  /** Pixels of upward travel. Smaller for body text, larger for hero stats. */
  travel?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Unified entrance animation for onboarding screens. Fades content in
 * while sliding up by `travel` pixels using ease-out-quart timing. Honours
 * Reduce Motion: when on, snaps to final state immediately so users with
 * vestibular issues aren't surprised.
 *
 * Wrap top-level pieces of an onboarding screen in this so the whole
 * onboarding flow has the same motion grammar.
 */
export default function FadeUp({
  children,
  delay = 0,
  duration = 520,
  travel = 14,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(travel)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        // Snap to final state, no motion.
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          delay,
          friction: 9,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => { cancelled = true; };
  }, [delay, duration]);

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }] }, style]}
    >
      {children}
    </Animated.View>
  );
}
