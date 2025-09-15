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
  
  // Animation state
  isAnimating = false;
  
  // Carousel properties
  carouselTransform = 0;
  private carouselWidth = 0;
  private isDragging = false;
  private startTransform = 0;

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

  openImageModal(imageSrc: string): void {
    // Find the index of the clicked image to support swiping between all images
    const index = this.screenshots.findIndex(screenshot => screenshot.src === imageSrc);
    this.selectedImageIndex = index >= 0 ? index : 0;
    this.isImageModalOpen = true;
    
    // Initialize carousel position after modal opens
    setTimeout(() => {
      this.initializeCarousel();
    }, 100);
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
    this.selectedImageIndex = 0;
    this.carouselTransform = 0;
    this.isDragging = false;
    this.isAnimating = false;
  }

  private initializeCarousel(): void {
    const container = document.querySelector('.carousel-container') as HTMLElement;
    if (container) {
      this.carouselWidth = container.offsetWidth;
      // Position the carousel to show the current image (always at index 1 in the visible array)
      this.carouselTransform = -this.carouselWidth;
    }
  }

  getVisibleImages() {
    // Return previous, current, and next images for smooth sliding
    const result = [];
    const totalImages = this.screenshots.length;
    
    // Previous image
    const prevIndex = (this.selectedImageIndex - 1 + totalImages) % totalImages;
    result.push(this.screenshots[prevIndex]);
    
    // Current image
    result.push(this.screenshots[this.selectedImageIndex]);
    
    // Next image
    const nextIndex = (this.selectedImageIndex + 1) % totalImages;
    result.push(this.screenshots[nextIndex]);
    
    return result;
  }

  nextImage(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.screenshots.length;
    this.animateToCurrentImage();
  }

  previousImage(): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.screenshots.length) % this.screenshots.length;
    this.animateToCurrentImage();
  }

  private animateToCurrentImage(): void {
    // The current image should always be at the center position (index 1)
    const targetTransform = -this.carouselWidth;
    const carouselTrack = document.querySelector('.carousel-track') as HTMLElement;
    
    if (carouselTrack) {
      carouselTrack.style.transition = 'transform 0.3s ease-out';
      this.carouselTransform = targetTransform;
      
      setTimeout(() => {
        this.isAnimating = false;
        if (carouselTrack) {
          carouselTrack.style.transition = '';
        }
      }, 300);
    } else {
      this.isAnimating = false;
    }
  }

  getCurrentImage() {
    return this.screenshots[this.selectedImageIndex];
  }

  // Touch gesture handlers
  onTouchStart(event: TouchEvent): void {
    if (this.isAnimating) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isDragging = true;
    this.startTransform = this.carouselTransform;
    
    // Disable transitions during dragging
    const carouselTrack = document.querySelector('.carousel-track') as HTMLElement;
    if (carouselTrack) {
      carouselTrack.style.transition = 'none';
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || this.isAnimating) return;
    
    // Prevent default behavior to avoid scrolling
    event.preventDefault();
    
    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.touchStartX;
    
    // Update carousel position in real-time
    this.carouselTransform = this.startTransform + deltaX;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.isDragging || this.isAnimating) return;
    
    this.isDragging = false;
    this.touchEndX = event.changedTouches[0].clientX;
    this.touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Re-enable transitions
    const carouselTrack = document.querySelector('.carousel-track') as HTMLElement;
    if (carouselTrack) {
      carouselTrack.style.transition = 'transform 0.3s ease-out';
    }
    
    // Only process horizontal swipes that are longer than vertical swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
      this.isAnimating = true;
      
      if (deltaX > 0) {
        // Swiped right - go to previous image
        this.selectedImageIndex = (this.selectedImageIndex - 1 + this.screenshots.length) % this.screenshots.length;
      } else {
        // Swiped left - go to next image
        this.selectedImageIndex = (this.selectedImageIndex + 1) % this.screenshots.length;
      }
      
      this.animateToCurrentImage();
    } else {
      // Snap back to current position if swipe wasn't strong enough
      this.carouselTransform = -this.carouselWidth;
      
      setTimeout(() => {
        if (carouselTrack) {
          carouselTrack.style.transition = '';
        }
      }, 300);
    }
  }
}
