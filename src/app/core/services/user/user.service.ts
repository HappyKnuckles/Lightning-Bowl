import { Injectable, signal } from '@angular/core';
import { ToastService } from '../toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  #username = signal<string>('');
  get username() {
    return this.#username;
  }

  constructor(private toastService: ToastService) {
    const storedUsername = localStorage.getItem('username');
    this.#username = signal(storedUsername ? this.capitalizeFirstLetter(storedUsername) : '');
  }

  setUsername(username: string): void {
    const capitalizedUsername = this.capitalizeFirstLetter(username);
    localStorage.setItem('username', capitalizedUsername);
    this.#username.set(capitalizedUsername);
    this.toastService.showToast(`Name updated to ${capitalizedUsername}`, 'reload-outline');
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}