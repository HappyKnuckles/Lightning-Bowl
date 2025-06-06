import { Component, OnDestroy } from '@angular/core';
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
export class ToastComponent implements OnDestroy {
  activeToasts: ToastData[] = [];

  /** Any additional toasts beyond 5 go into this queue */
  private toastQueue: ToastData[] = [];

  private nextId = 1;
  private toastSubscription: Subscription;

  /** Maximum number of toasts shown at once */
  private readonly MAX_ACTIVE = 5;

  /** How long each toast stays open (in ms) */
  readonly TOAST_DURATION = 3000;

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
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
