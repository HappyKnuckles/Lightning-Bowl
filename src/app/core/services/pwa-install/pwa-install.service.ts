import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  private showInstallPromptSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    this.initializeInstallPrompt();
  }

  private initializeInstallPrompt(): void {
    let canShowPrompt = false;
    let shouldShowPrompt = false;
    let interactionCount = 0;
    const requiredInteractions = 3;

    setTimeout(() => {
      canShowPrompt = true;
      if (shouldShowPrompt) {
        this.showInstallPromptSubject.next(true);
      }
    }, 10000);

    const userInteractionEvents = ['click', 'touch', 'keydown', 'scroll'];
    const onUserInteraction = () => {
      interactionCount++;

      if (interactionCount >= requiredInteractions) {
        canShowPrompt = true;
        if (shouldShowPrompt) {
          this.showInstallPromptSubject.next(true);
        }
        userInteractionEvents.forEach((event) => {
          document.removeEventListener(event, onUserInteraction);
        });
      }
    };

    userInteractionEvents.forEach((event) => {
      document.addEventListener(event, onUserInteraction);
    });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();

      this.deferredPrompt = event;

      const isDismissed = this.isInstallPromptDismissed();
      const isInstalled = this.isAppInstalled();
      // Additional check: don't show if prompt was recently dismissed (within last 5 minutes)
      const recentDismissal = this.isRecentlyDismissed(5 * 60 * 1000); // 5 minutes

      if (!isDismissed && !isInstalled && !recentDismissal) {
        if (canShowPrompt) {
          this.showInstallPromptSubject.next(true);
        } else {
          shouldShowPrompt = true;
        }
      }
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.showInstallPromptSubject.next(false);
      localStorage.removeItem('pwa-install-dismissed');
    });

    if (this.isIOSSafari() && this.isPWAInstallable()) {
      setTimeout(() => {
        const isDismissed = this.isInstallPromptDismissed();
        const isInstalled = this.isAppInstalled();

        // Additional check: don't show if prompt was recently dismissed (within last 5 minutes)
        const recentDismissal = this.isRecentlyDismissed(5 * 60 * 1000); // 5 minutes

        if (!isDismissed && !isInstalled && !recentDismissal) {
          if (canShowPrompt) {
            this.showInstallPromptSubject.next(true);
          } else {
            shouldShowPrompt = true;
          }
        }
      }, 2000);
    }
  }

  canShowInstallPrompt(): Observable<boolean> {
    return this.showInstallPromptSubject.asObservable();
  }

  async triggerInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      if (this.isIOSSafari()) {
        this.showInstallPromptSubject.next(false);
        return false;
      }
      return false;
    }

    try {
      this.deferredPrompt.prompt();

      const { outcome } = await this.deferredPrompt.userChoice;

      this.deferredPrompt = null;
      this.showInstallPromptSubject.next(false);

      return outcome === 'accepted';
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }

  dismissInstallPrompt(): void {
    // Store dismissal timestamp in localStorage to persist across sessions
    const dismissalTime = Date.now().toString();
    localStorage.setItem('pwa-install-dismissed', dismissalTime);
    this.showInstallPromptSubject.next(false);
  }

  private isInstallPromptDismissed(): boolean {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) {
      return false;
    }
    
    // Check if dismissal was within the last 24 hours (86400000 ms)
    const dismissalTimestamp = parseInt(dismissedTime, 10);
    const currentTime = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (currentTime - dismissalTimestamp) < twentyFourHours;
  }

  private isRecentlyDismissed(timeWindow: number): boolean {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedTime) {
      return false;
    }
    
    const dismissalTimestamp = parseInt(dismissedTime, 10);
    const currentTime = Date.now();
    
    return (currentTime - dismissalTimestamp) < timeWindow;
  }

  private isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true; // iOS Safari
  }

  private isIOSSafari(): boolean {
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent); // Exclude Chrome, Firefox, Edge, Opera on iOS
  }

  private isPWAInstallable(): boolean {
    return 'serviceWorker' in navigator && window.location.protocol === 'https:' && document.querySelector('link[rel="manifest"]') !== null;
  }

  isInstallable(): boolean {
    return this.deferredPrompt !== null || this.isIOSSafari();
  }
}
