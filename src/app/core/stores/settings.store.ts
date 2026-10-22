import { inject, Injectable, signal } from '@angular/core';
import { BowlerFit } from 'src/app/core/models/fit.model';
import { SETTINGS_KEYS } from 'src/app/core/services/storage/storage-keys';
import { StorageRepository } from 'src/app/core/services/storage/storage.repository';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly #storageRepository = inject(StorageRepository);
  readonly #fit = signal<BowlerFit | undefined>(undefined);

  readonly pinInputMode = signal<boolean>(true);
  readonly fit = this.#fit.asReadonly();

  loadPinInputMode(): void {
    const mode = localStorage.getItem('pin-input-mode');
    const pinInputMode = mode === null ? false : mode === 'hit';
    this.pinInputMode.set(pinInputMode);
  }

  savePinInputMode(pinMode: string): void {
    this.pinInputMode.set(pinMode === 'hit');
    const mode = pinMode === 'hit' ? 'hit' : 'missing';
    localStorage.setItem('pin-input-mode', mode);
  }

  async loadFit(): Promise<void> {
    try {
      this.#fit.set((await this.#storageRepository.get<BowlerFit>(SETTINGS_KEYS.bowlerFit)) ?? undefined);
    } catch (error) {
      console.error('Error loading fit:', error);
    }
  }

  async saveFit(fit: BowlerFit | undefined): Promise<void> {
    if (fit) {
      await this.#storageRepository.set(SETTINGS_KEYS.bowlerFit, fit);
    } else {
      await this.#storageRepository.remove(SETTINGS_KEYS.bowlerFit);
    }
    this.#fit.set(fit);
  }
}
