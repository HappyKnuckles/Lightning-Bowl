import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  #isLoading = signal<boolean>(false);
  get isLoading() {
    return this.#isLoading;
  }

  setLoading(isLoading: boolean): void {
    this.#isLoading.set(isLoading);
  }
}
