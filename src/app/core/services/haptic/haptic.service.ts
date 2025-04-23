import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({ providedIn: 'root' })
export class HapticService {
  // Mapping von Style auf Fallback-Dauer (in ms)
  private readonly fallbackDurations: Record<ImpactStyle, number> = {
    [ImpactStyle.Light]: 50,
    [ImpactStyle.Medium]: 100,
    [ImpactStyle.Heavy]: 200,
  };

  /**
   * Versucht zuerst Capacitor Haptics,
   * und fällt bei Fehlern auf navigator.vibrate zurück.
   */
  async vibrate(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      const duration = this.fallbackDurations[style] ?? this.fallbackDurations[ImpactStyle.Light];
      if (navigator.vibrate) {
        navigator.vibrate(duration);
      } else {
        console.warn('Haptic feedback not supported on this platform.');
      }
      console.error('Error triggering haptic feedback:', e);
    }
  }
}
