import { inject, Injectable, signal } from '@angular/core';
import { BallLayout } from 'src/app/core/models/ball.model';
import { BowlerFit } from 'src/app/core/models/fit.model';
import { SETTINGS_KEYS } from 'src/app/core/services/storage/storage-keys';
import { StorageRepository } from 'src/app/core/services/storage/storage.repository';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  readonly #storageRepository = inject(StorageRepository);
  readonly #fit = signal<BowlerFit | undefined>(undefined);
  readonly #layoutPresets = signal<BallLayout[]>([]);

  readonly pinInputMode = signal<boolean>(true);
  readonly fit = this.#fit.asReadonly();
  /** Layouts the bowler saved as quick picks, on top of the built-in LAYOUT_PRESETS. */
  readonly layoutPresets = this.#layoutPresets.asReadonly();

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

  async loadLayoutPresets(): Promise<void> {
    try {
      this.#layoutPresets.set((await this.#storageRepository.get<BallLayout[]>(SETTINGS_KEYS.layoutPresets)) ?? []);
    } catch (error) {
      console.error('Error loading layout presets:', error);
    }
  }

  async saveLayoutPresets(presets: BallLayout[]): Promise<void> {
    await this.#storageRepository.set(SETTINGS_KEYS.layoutPresets, presets);
    this.#layoutPresets.set(presets);
  }
}
