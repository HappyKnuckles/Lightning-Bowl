import { Component, Input, Output, EventEmitter, signal, inject, model, effect, input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonImg,
  IonIcon,
  IonButton,
  IonRippleEffect,
  IonSegment,
  IonSegmentButton,
  IonSegmentContent,
  IonLabel,
  IonSegmentView,
  IonList,
} from '@ionic/angular/standalone';
import { Ball } from 'src/app/core/models/ball.model';
import { addIcons } from 'ionicons';
import { openOutline, heart, heartOutline, globeOutline } from 'ionicons/icons';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { FavoritesService } from 'src/app/core/services/favorites/favorites.service';

@Component({
  selector: 'app-ball-swipe-card',
  templateUrl: './ball-swipe-card.component.html',
  styleUrls: ['./ball-swipe-card.component.scss'],
  standalone: true,
  imports: [
    IonList,
    CommonModule,
    NgStyle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonImg,
    IonIcon,
    IonButton,
    IonRippleEffect,
    IonSegment,
    IonSegmentButton,
    IonSegmentContent,
    IonLabel,
    IonSegmentView,
  ],
})
export class BallSwipeCardComponent {
  ball = input.required<Ball>();
  @Input() inArsenal = false;
  @Output() similarMovement = new EventEmitter<Ball>();
  @Output() similarCore = new EventEmitter<Ball>();
  @Output() similarCoverstock = new EventEmitter<Ball>();
  @Output() favoriteToggle = new EventEmitter<{ event: Event; ball: Ball }>();
  @Output() addToArsenal = new EventEmitter<Ball>();
  @Output() removeFromArsenal = new EventEmitter<Ball>();

  protected storageService = inject(StorageService);
  protected favoritesService = inject(FavoritesService);

  // View child to access the segment element
  @ViewChild('segment', { read: ElementRef }) segmentElement?: ElementRef;

  image = model<string>('');

  // Signals for image transition (sliding effect)
  // When on coverstock: core is at 100% (ready to slide in from right)
  // When on core: coverstock is at -100% (ready to slide in from left)
  coreSlidePosition = signal<number>(100);
  coverstockSlidePosition = signal<number>(0);
  currentSegment = signal<string>('coverstock');

  constructor() {
    addIcons({ openOutline, heart, heartOutline, globeOutline });
    effect(
      () => {
        this.image.set(this.ball().thumbnail_image);
      },
      { allowSignalWrites: true },
    );
  }

  private snapToCurrentSegment() {
    if (this.currentSegment() === 'coverstock') {
      this.coreSlidePosition.set(100); // Core hidden to the right (ready to slide in)
      this.coverstockSlidePosition.set(0); // Coverstock visible at center
    } else {
      this.coreSlidePosition.set(0); // Core visible at center
      this.coverstockSlidePosition.set(-100); // Coverstock hidden to the left (ready to slide in)
    }
  }

  changeImage(event: CustomEvent) {
    const newValue = event.detail.value;
    this.currentSegment.set(newValue);

    if (newValue === 'coverstock') {
      // Coverstock slides in from left (-100% to 0%) to cover core
      this.coreSlidePosition.set(0); // Core stays at center (gets covered)
      this.coverstockSlidePosition.set(0); // Coverstock slides to center
      this.image.set(this.ball().thumbnail_image);

      // After transition, move core to right side for next transition
      setTimeout(() => {
        this.coreSlidePosition.set(100);
      }, 400);
    } else if (newValue === 'core') {
      // Core slides in from right (100% to 0%) to cover coverstock
      this.coreSlidePosition.set(0); // Core slides to center
      this.coverstockSlidePosition.set(0); // Coverstock stays at center (gets covered)
      this.image.set(this.ball().core_image);

      // After transition, move coverstock to left side for next transition
      setTimeout(() => {
        this.coverstockSlidePosition.set(-100);
      }, 400);
    }
  }

  onSimilarMovement(event: Event) {
    event.stopPropagation();
    this.similarMovement.emit(this.ball());
  }

  onSimilarCore(event: Event) {
    event.stopPropagation();
    this.similarCore.emit(this.ball());
  }

  onSimilarCoverstock(event: Event) {
    event.stopPropagation();
    this.similarCoverstock.emit(this.ball());
  }

  onToggleFavorite(event: Event) {
    event.stopPropagation();
    this.favoriteToggle.emit({ event, ball: this.ball() });
  }

  onAddToArsenal(event: Event) {
    event.stopPropagation();
    this.addToArsenal.emit(this.ball());
  }

  onRemoveFromArsenal(event: Event) {
    event.stopPropagation();
    this.removeFromArsenal.emit(this.ball());
  }

  // Helper methods for core data display
  getLengthPotential(ball: Ball): string {
    const rg = parseFloat(ball.core_rg);
    if (rg < 2.46) return 'Very High';
    if (rg < 2.48) return 'High';
    if (rg < 2.52) return 'Medium';
    if (rg < 2.54) return 'Low';
    return 'Very Low';
  }

  getFlarePotential(ball: Ball): string {
    const diff = parseFloat(ball.core_diff);
    if (diff > 0.055) return 'Very High';
    if (diff > 0.045) return 'High';
    if (diff > 0.035) return 'Medium';
    if (diff > 0.02) return 'Low';
    return 'Very Low';
  }

  isInArsenal(): boolean {
    return this.inArsenal;
  }
}
