import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<{
    message: string;
    icon: string;
    error?: boolean;
  }>();
  toastState$ = this.toastSubject.asObservable();

  constructor() {}

  showToast(message: string, icon: string, error?: boolean): void {
    this.toastSubject.next({ message, icon, error });
  }
}
