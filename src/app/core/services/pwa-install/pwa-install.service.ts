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
      const isDismissed = this.isInstallPromptDismissed();
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

    // For iOS Safari, check if we should show the install prompt
    // since it doesn't support beforeinstallprompt
    if (this.isIOSSafari() && this.isPWAInstallable()) {
      setTimeout(() => {
        const isDismissed = this.isInstallPromptDismissed();
        const isInstalled = this.isAppInstalled();
        
        if (!isDismissed && !isInstalled) {
          this.showInstallPromptSubject.next(true);
        }
      }, 2000); // Slight delay to ensure page is fully loaded
    }
  }

  canShowInstallPrompt(): Observable<boolean> {
    return this.showInstallPromptSubject.asObservable();
  }

  async triggerInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      // On iOS or browsers without beforeinstallprompt support,
      // we can't trigger installation programmatically
      if (this.isIOSSafari()) {
        // For iOS, just hide the modal since user will follow manual instructions
        this.showInstallPromptSubject.next(false);
        return false;
      }
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

  private isInstallPromptDismissed(): boolean {
    const dismissedUntil = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedUntil) {
      return false;
    }
    
    const dismissDate = new Date(dismissedUntil);
    const now = new Date();
    
    return now < dismissDate;
  }

  private isAppInstalled(): boolean {
    // Check if app is installed (for Chromium-based browsers)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true; // iOS Safari
  }

  private isIOSSafari(): boolean {
    const userAgent = navigator.userAgent;
    // More reliable iOS Safari detection
    return /iPad|iPhone|iPod/.test(userAgent) && 
           /Safari/.test(userAgent) &&
           !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent); // Exclude Chrome, Firefox, Edge, Opera on iOS
  }

  private isPWAInstallable(): boolean {
    // Check basic PWA requirements
    return 'serviceWorker' in navigator && 
           window.location.protocol === 'https:' &&
           document.querySelector('link[rel="manifest"]') !== null;
  }

  isInstallable(): boolean {
    return this.deferredPrompt !== null || this.isIOSSafari();
  }
}