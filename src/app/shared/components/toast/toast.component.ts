import { Component, OnDestroy, ViewChildren, QueryList, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
  @ViewChildren('toastRef') toastRefs!: QueryList<IonToast>;
  
  activeToasts: ToastData[] = [];
  private toastHeights: number[] = [];

  /** Any additional toasts beyond 5 go into this queue */
  private toastQueue: ToastData[] = [];

  private nextId = 1;
  private toastSubscription: Subscription;

  /** Maximum number of toasts shown at once */
  private readonly MAX_ACTIVE = 5;

  /** How long each toast stays open (in ms) */
  readonly TOAST_DURATION = 3000;

  /** Default height for toasts before measurement */
  private readonly DEFAULT_TOAST_HEIGHT = 60;

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {
    this.toastSubscription = this.toastService.toastState$.subscribe((raw) => {
      const newToast: ToastData = {
        id: this.nextId++,
        message: raw.message,
        icon: raw.icon,
        isError: raw.error ?? false,
      };

      if (this.activeToasts.length < this.MAX_ACTIVE) {
        this.activeToasts.push(newToast);
        // Trigger height measurement after adding new toast
        setTimeout(() => this.measureToastHeights(), 50);
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

  ngAfterViewInit() {
    // Measure toast heights after view initialization
    this.toastRefs.changes.subscribe(() => {
      this.measureToastHeights();
    });
    this.measureToastHeights();
  }

  /**
   * Measure the actual heights of all toast elements
   */
  private measureToastHeights() {
    setTimeout(() => {
      this.toastHeights = [];
      this.toastRefs.forEach((toastRef, index) => {
        try {
          // Access the underlying HTMLElement through the nativeElement property  
          const element = (toastRef as any).el?.nativeElement || (toastRef as any).el;
          const height = element?.offsetHeight || this.DEFAULT_TOAST_HEIGHT;
          this.toastHeights[index] = height;
        } catch (e) {
          this.toastHeights[index] = this.DEFAULT_TOAST_HEIGHT;
        }
      });
      this.cdr.detectChanges();
    }, 100); // Small delay to ensure elements are rendered
  }

  /**
   * Calculate the Y offset for a toast at the given index
   * @param index - The index of the toast in the activeToasts array
   * @returns The cumulative offset in pixels
   */
  getToastOffset(index: number): number {
    let offset = 0;
    // Sum up the heights of all toasts below this one (with some padding)
    for (let i = 0; i < index; i++) {
      const height = this.toastHeights[i] || this.DEFAULT_TOAST_HEIGHT;
      offset += height + 8; // 8px gap between toasts
    }
    return offset;
  }

  /**
   * Called whenever an individual IonToast’s (didDismiss) event fires.
   * Remove the toast from activeToasts, then immediately pull one from the queue (if any).
   */
  onToastDidDismiss(dismissedId: number) {
    // Remove that toast from the active list
    this.activeToasts = this.activeToasts.filter((t) => t.id !== dismissedId);

    // If there’s something waiting in the queue, “activate” the next one
    if (this.toastQueue.length > 0) {
      const next = this.toastQueue.shift()!;
      this.activeToasts.push(next);
    }

    // Recalculate heights after dismissal
    setTimeout(() => this.measureToastHeights(), 50);
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
