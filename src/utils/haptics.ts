import * as Haptics from 'expo-haptics';
import { useStore } from '../store/useStore';

export function hapticLight() {
  if (useStore.getState().settings.hapticFeedback) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function hapticMedium() {
  if (useStore.getState().settings.hapticFeedback) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function hapticSuccess() {
  if (useStore.getState().settings.hapticFeedback) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function hapticError() {
  if (useStore.getState().settings.hapticFeedback) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
