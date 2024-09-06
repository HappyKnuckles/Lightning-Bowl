import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class HapticService {

  constructor() { }

  vibrate(style: ImpactStyle, duration: number) {
    // Add haptic feedback with fallback for web
    if (Haptics) {
      Haptics.impact({ style: style });
    } else if (navigator.vibrate) {
      navigator.vibrate(duration); // Vibrate for 200ms
    } else {
      console.log('Haptic feedback not supported on this platform.');
    }
  }
}
