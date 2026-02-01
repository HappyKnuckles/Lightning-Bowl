import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Mapping von Style auf Fallback-Dauer (in ms)
const fallbackDurations: Record<ImpactStyle, number> = {
  [ImpactStyle.Light]: 50,
  [ImpactStyle.Medium]: 100,
  [ImpactStyle.Heavy]: 200,
};

/**
 * Trigger haptic feedback vibration
 * Tries Capacitor Haptics first, falls back to navigator.vibrate if unavailable
 * @param style Impact style (Light, Medium, or Heavy)
 */
export async function vibrate(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  try {
    await Haptics.impact({ style });
  } catch (e) {
    const duration = fallbackDurations[style] ?? fallbackDurations[ImpactStyle.Light];
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    } else {
      console.warn('Haptic feedback not supported on this platform.');
    }
    console.error('Error triggering haptic feedback:', e);
  }
}
