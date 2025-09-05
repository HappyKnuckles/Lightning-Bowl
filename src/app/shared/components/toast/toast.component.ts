import { Component, OnDestroy, ViewChildren, QueryList, AfterViewInit, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  bug,
  checkmarkOutline,
  eyeOutline,
  informationCircleOutline,
  refreshOutline,
  reloadOutline,
  removeOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { NgFor, NgStyle } from '@angular/common';

interface ToastData {
  id: number;
  message: string;
  icon: string;
  isError?: boolean;
}

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [IonToast, NgFor, NgStyle],
})
export class ToastComponent implements OnDestroy, AfterViewInit {
  @ViewChildren('toastRef', { read: ElementRef }) toastElements!: QueryList<ElementRef>;
  
  activeToasts: ToastData[] = [];

  /** Any additional toasts beyond 5 go into this queue */
  private toastQueue: ToastData[] = [];

  private nextId = 1;
  private toastSubscription: Subscription;

  /** Maximum number of toasts shown at once */
  private readonly MAX_ACTIVE = 5;

  /** How long each toast stays open (in ms) */
  readonly TOAST_DURATION = 3000;

  /** Minimum spacing between toasts */
  private readonly MIN_SPACING = 60;

  constructor(private toastService: ToastService) {
    this.toastSubscription = this.toastService.toastState$.subscribe((raw) => {
      const newToast: ToastData = {
        id: this.nextId++,
        message: raw.message,
        icon: raw.icon,
        isError: raw.error ?? false,
      };

      if (this.activeToasts.length < this.MAX_ACTIVE) {
        this.activeToasts.push(newToast);
      } else {
        this.toastQueue.push(newToast);
      }
    });

    addIcons({
      bug,
      add,
      checkmarkOutline,
      refreshOutline,
      reloadOutline,
      shareSocialOutline,
      removeOutline,
      informationCircleOutline,
      eyeOutline,
    });
  }

  ngAfterViewInit(): void {
    // Subscribe to changes in toast elements to recalculate positions
    this.toastElements.changes.subscribe(() => {
      // Small delay to ensure DOM is updated
      setTimeout(() => this.updateToastPositions(), 10);
    });
  }

  /**
   * Calculate the offset for a toast at given index based on heights of previous toasts
   */
  getToastOffset(index: number): number {
    if (index === 0) return 0;

    let totalOffset = 0;
    const toastArray = this.toastElements.toArray();
    
    for (let i = 0; i < index && i < toastArray.length; i++) {
      const elementRef = toastArray[i];
      let toastHeight = this.MIN_SPACING; // Default minimum spacing
      
      try {
        // Get the actual height if available
        const nativeElement = elementRef.nativeElement;
        if (nativeElement && nativeElement.offsetHeight > 0) {
          toastHeight = Math.max(nativeElement.offsetHeight, this.MIN_SPACING);
        }
      } catch {
        // Fallback to minimum spacing if measurement fails
        toastHeight = this.MIN_SPACING;
      }
      
      totalOffset += toastHeight;
    }
    
    return totalOffset;
  }

  /**
   * Trigger position recalculation for all toasts
   */
  private updateToastPositions(): void {
    // This will trigger change detection and recalculate positions
    // No direct manipulation needed as template uses getToastOffset
  }

  /**
   * Called whenever an individual IonToast's (didDismiss) event fires.
   * Remove the toast from activeToasts, then immediately pull one from the queue (if any).
   */
  onToastDidDismiss(dismissedId: number) {
    // Remove that toast from the active list
    this.activeToasts = this.activeToasts.filter((t) => t.id !== dismissedId);

    // If there's something waiting in the queue, "activate" the next one
    if (this.toastQueue.length > 0) {
      const next = this.toastQueue.shift()!;
      this.activeToasts.push(next);
    }

    // Trigger position recalculation after a short delay
    setTimeout(() => this.updateToastPositions(), 10);
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}