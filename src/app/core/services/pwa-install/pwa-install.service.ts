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
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Store the event for later use
      this.deferredPrompt = event;
      
      // Check if user has previously dismissed or already installed
      const isDismissed = localStorage.getItem('pwa-install-dismissed');
      const isInstalled = this.isAppInstalled();
      
      // Show install prompt if not dismissed and not installed
      if (!isDismissed && !isInstalled) {
        this.showInstallPromptSubject.next(true);
      }
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.showInstallPromptSubject.next(false);
      localStorage.removeItem('pwa-install-dismissed');
    });
  }

  canShowInstallPrompt(): Observable<boolean> {
    return this.showInstallPromptSubject.asObservable();
  }

  async triggerInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      // Clean up
      this.deferredPrompt = null;
      this.showInstallPromptSubject.next(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error during PWA installation:', error);
      return false;
    }
  }

  dismissInstallPrompt(): void {
    // Mark as dismissed for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem('pwa-install-dismissed', dismissUntil.toISOString());
    
    this.showInstallPromptSubject.next(false);
  }

  private isAppInstalled(): boolean {
    // Check if app is installed (for Chromium-based browsers)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true; // iOS Safari
  }

  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }
}