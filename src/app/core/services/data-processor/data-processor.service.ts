import { Injectable, OnDestroy } from '@angular/core';
import { Game } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class DataProcessorService implements OnDestroy {
  private worker: Worker | null = null;
  private workerSupported = typeof Worker !== 'undefined';

  constructor() {
    if (this.workerSupported) {
      this.initializeWorker();
    }
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker(new URL('../../workers/data-processor.worker', import.meta.url), { type: 'module' });
    } catch (error) {
      console.warn('Failed to initialize data processor worker, falling back to main thread:', error);
      this.workerSupported = false;
    }
  }

  async processGameHistoryAsync(games: Game[]): Promise<{ games: Game[]; needsUpdate: boolean }> {
    if (!this.workerSupported || !this.worker) {
      // Fallback to main thread processing
      return this.processGameHistorySync(games);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Game history processing timeout'));
      }, 30000);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'GAME_HISTORY_PROCESSED') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          resolve(payload);
        }
      };

      this.worker!.addEventListener('message', handleMessage);
      this.worker!.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.worker!.postMessage({
        type: 'PROCESS_GAME_HISTORY',
        payload: { games },
      });
    });
  }

  async sortGamesAsync(games: Game[], ascending: boolean): Promise<Game[]> {
    if (!this.workerSupported || !this.worker) {
      return this.sortGamesSync(games, ascending);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Game sorting timeout'));
      }, 10000);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'GAMES_SORTED') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          resolve(payload);
        }
      };

      this.worker!.addEventListener('message', handleMessage);
      this.worker!.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.worker!.postMessage({
        type: 'SORT_GAMES',
        payload: { games, ascending },
      });
    });
  }

  isWorkerAvailable(): boolean {
    return this.workerSupported && this.worker !== null;
  }

  // Fallback synchronous methods
  private processGameHistorySync(gameHistory: Game[]): { games: Game[]; needsUpdate: boolean } {
    let needsUpdate = false;

    gameHistory.forEach((game) => {
      const legacyGame = game as Game & { pattern?: string };
      if (legacyGame.pattern && !game.patterns) {
        game.patterns = [legacyGame.pattern];
        delete legacyGame.pattern;
        needsUpdate = true;
      } else if (!game.patterns) {
        game.patterns = [];
        needsUpdate = true;
      }

      if (legacyGame.pattern !== undefined) {
        delete legacyGame.pattern;
        needsUpdate = true;
      }

      if (game.patterns && Array.isArray(game.patterns)) {
        const originalPatternsStr = JSON.stringify(game.patterns);
        game.patterns.sort();
        if (JSON.stringify(game.patterns) !== originalPatternsStr) {
          needsUpdate = true;
        }
      }
      if (game.balls && Array.isArray(game.balls)) {
        const originalBallsStr = JSON.stringify(game.balls);
        game.balls.sort();
        if (JSON.stringify(game.balls) !== originalBallsStr) {
          needsUpdate = true;
        }
      }
    });

    return { games: gameHistory, needsUpdate };
  }

  private sortGamesSync(games: Game[], ascending: boolean): Game[] {
    return games.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
