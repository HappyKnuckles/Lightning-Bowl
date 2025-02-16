import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/services/toast/toast.service';
import { IonToast } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, bug, checkmarkOutline, refreshOutline, reloadOutline, removeOutline, shareSocialOutline } from 'ionicons/icons';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  standalone: true,
  imports: [IonToast],
})
export class ToastComponent implements OnDestroy {
  isOpen: boolean = false;
  message: string = '';
  icon: string = '';
  isError?: boolean = false;

  private toastSubscription: Subscription;

  constructor(private toastService: ToastService) {
    this.toastSubscription = this.toastService.toastState$.subscribe((toast) => {
      this.message = toast.message;
      this.icon = toast.icon;
      this.isError = toast.error;
      this.isOpen = true;
      setTimeout(() => {
        this.isOpen = false;
      }, 4000);
    });
    addIcons({
      bug,
      add,
      checkmarkOutline,
      refreshOutline,
      reloadOutline,
      shareSocialOutline,
      removeOutline,
    });
  }

  ngOnDestroy(): void {
    this.toastSubscription.unsubscribe();
  }
}
