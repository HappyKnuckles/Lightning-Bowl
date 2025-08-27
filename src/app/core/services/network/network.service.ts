import { Injectable, signal } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private _isOnline = signal<boolean>(navigator.onLine);

  get isOnline() {
    return this._isOnline();
  }

  get isOffline() {
    return !this._isOnline();
  }

  constructor() {
    // Listen for online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
      .pipe(startWith(navigator.onLine))
      .subscribe(status => this._isOnline.set(status));
  }
}