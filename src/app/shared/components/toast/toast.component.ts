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

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [IonToast],
})
export class ToastComponent implements OnDestroy {
  isOpen = false;
  message = '';
  icon = '';
  isError?: boolean = false;
  private toastQueue: { message: string; icon: string; error?: boolean }[] = [];

  private toastSubscription: Subscription;

  constructor(private toastService: ToastService) {
    this.toastSubscription = this.toastService.toastState$.subscribe((toast) => {
      this.toastQueue.push(toast);
      if (!this.isOpen) {
        this.showNextToast();
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

  showNextToast(): void {
    if (this.toastQueue.length > 0) {
      const nextToast = this.toastQueue.shift();
      if (nextToast) {
        this.message = nextToast.message;
        this.icon = nextToast.icon;
        this.isError = nextToast.error;
        this.isOpen = true;
      }
    }
  }

  onToastDismiss(): void {
    this.isOpen = false;
    setTimeout(() => {
      this.showNextToast();
    }, 100);
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
