import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, flash, wifiOutline, notifications, phonePortrait, download, shareOutline, checkmark, add, checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-pwa-install-prompt',
  templateUrl: './pwa-install-prompt.component.html',
  styleUrls: ['./pwa-install-prompt.component.scss'],
  standalone: true,
  imports: [CommonModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter],
})
export class PwaInstallPromptComponent implements OnInit {
  @Input() isOpen = false;
  @Input() canInstall = false;
  @Output() install = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
  presentingElement!: HTMLElement | null;

  isChrome = false;
  isIOS = false;

  // Image gallery functionality
  isImageModalOpen = false;
  selectedImageIndex = 0;
  screenshots = [
    { src: 'assets/screenshots/start.png', alt: 'Start Page', caption: 'Track your games' },
    { src: 'assets/screenshots/stats.png', alt: 'Statistics Page', caption: 'View detailed stats' },
    { src: 'assets/screenshots/history.png', alt: 'History Page', caption: 'Browse game history' },
    { src: 'assets/screenshots/arsenal.png', alt: 'Arsenal Page', caption: 'Manage your arsenals' },
    { src: 'assets/screenshots/balls.png', alt: 'Balls Page', caption: 'Browse balls' },
    { src: 'assets/screenshots/pattern.png', alt: 'Pattern Page', caption: 'Browse patterns' }
  ];

  // Touch gesture handling
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private minSwipeDistance = 50;

  constructor() {
    addIcons({
      close,
      flash,
      wifiOutline,
      notifications,
      phonePortrait,
      download,
      shareOutline,
      checkmark,
      add,
      checkmarkCircle,
    });
  }

  ngOnInit(): void {
    this.detectBrowser();
    this.presentingElement = document.querySelector('.ion-page');
  }

  private detectBrowser(): void {
    const userAgent = navigator.userAgent;
    // More precise Chrome/Chromium/Edge detection that excludes Safari
    this.isChrome =
      (/Chrome|Chromium|Edg/.test(userAgent) && !/Safari\/[0-9]/.test(userAgent)) ||
      (/Chrome/.test(userAgent) && /Safari/.test(userAgent) && !/Mobile.*Safari/.test(userAgent));

    // Precise iOS Safari detection - iOS device with Safari but not Chrome/Firefox/Edge on iOS
    this.isIOS = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent); // Exclude Chrome, Firefox, Edge, Opera on iOS
  }

  onInstall(): void {
    this.install.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  openImageModal(imageSrc: string, _imageAlt: string): void {
    // Find the index of the clicked image to support swiping between all images
    const index = this.screenshots.findIndex(screenshot => screenshot.src === imageSrc);
    this.selectedImageIndex = index >= 0 ? index : 0;
    this.isImageModalOpen = true;
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
    this.selectedImageIndex = 0;
  }

  nextImage(): void {
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.screenshots.length;
  }

  previousImage(): void {
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.screenshots.length) % this.screenshots.length;
  }

  getCurrentImage() {
    return this.screenshots[this.selectedImageIndex];
  }

  // Touch gesture handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    // Prevent default behavior to avoid scrolling
    event.preventDefault();
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Only process horizontal swipes that are longer than vertical swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped right - go to previous image
        this.previousImage();
      } else {
        // Swiped left - go to next image
        this.nextImage();
      }
    }
  }
}
