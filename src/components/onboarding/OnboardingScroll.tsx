import { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, ViewStyle, StyleProp } from 'react-native';

interface Props extends Omit<ScrollViewProps, 'contentContainerStyle'> {
  children: ReactNode;
  /**
   * Extra styles applied to the contentContainerStyle. Defaults already
   * include `flexGrow: 1` (so short content still fills the screen and
   * `justifyContent: 'space-between'` works) and `paddingBottom: 40`.
   */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Onboarding wrapper that makes a screen zoom-safe. iOS Display Zoom and
 * larger Dynamic Type sizes can push the bottom Continue button below the
 * viewport on smaller devices - wrapping the screen body in a ScrollView
 * with `flexGrow: 1` lets the layout still use `justifyContent: 'space-between'`
 * for normal sizes while letting users scroll to reach the button when
 * the layout overflows.
 *
 * Drop-in replacement: replace the outer `<View style={styles.content}>` of
 * an onboarding screen with `<OnboardingScroll>` and pass the same children.
 *
 * Why this and not editing every screen: there are ~22 onboarding screens.
 * One reusable wrapper means a single place to fix layout regressions.
 */
export default function OnboardingScroll({ children, contentStyle, ...rest }: Props) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        {
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingBottom: 40,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
