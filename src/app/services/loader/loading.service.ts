import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _isLoading = signal<boolean>(false);

  constructor() {}
  get isLoading() {
    return this._isLoading();
  }

  setLoading(isLoading: boolean): void {
    this._isLoading.set(isLoading);
  }
}
