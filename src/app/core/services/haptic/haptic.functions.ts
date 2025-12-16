import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Trigger a haptic feedback with the specified impact style
 * @param style The haptic impact style (Light, Medium, Heavy)
 */
export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.warn('Haptics not supported on this device:', error);
  }
}

/**
 * Trigger a light haptic feedback
 */
export async function triggerLightHaptic(): Promise<void> {
  return triggerHaptic(ImpactStyle.Light);
}

/**
 * Trigger a medium haptic feedback
 */
export async function triggerMediumHaptic(): Promise<void> {
  return triggerHaptic(ImpactStyle.Medium);
}

/**
 * Trigger a heavy haptic feedback
 */
export async function triggerHeavyHaptic(): Promise<void> {
  return triggerHaptic(ImpactStyle.Heavy);
}

/**
 * Trigger a vibration pattern (for special events like strikes)
 */
export async function triggerVibrationPattern(): Promise<void> {
  try {
    await Haptics.vibrate({ duration: 200 });
  } catch (error) {
    console.warn('Vibration not supported on this device:', error);
  }
}
