import { Injectable, OnDestroy } from '@angular/core';
import { Game } from '../../models/game.model';
import { Stats, SessionStats } from '../../models/stats.model';

@Injectable({
  providedIn: 'root',
})
export class StatsWorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private workerSupported = typeof Worker !== 'undefined';

  constructor() {
    if (this.workerSupported) {
      this.initializeWorker();
    }
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker(new URL('../../workers/stats.worker', import.meta.url), { type: 'module' });
    } catch (error) {
      console.warn('Failed to initialize stats worker, falling back to main thread:', error);
      this.workerSupported = false;
    }
  }

  async calculateStatsAsync(games: Game[]): Promise<Stats | SessionStats> {
    if (!this.workerSupported || !this.worker) {
      // Fallback: stats will be calculated on main thread by existing service
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Stats calculation timeout'));
      }, 30000); // 30 second timeout

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'STATS_RESULT') {
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
        type: 'CALCULATE_STATS',
        payload: { games },
      });
    });
  }

  async calculateBallStatsAsync(games: Game[]): Promise<Record<string, any>> {
    if (!this.workerSupported || !this.worker) {
      throw new Error('Worker not available');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Ball stats calculation timeout'));
      }, 30000);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'BALL_STATS_RESULT') {
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
        type: 'CALCULATE_BALL_STATS',
        payload: { games },
      });
    });
  }

  isWorkerAvailable(): boolean {
    return this.workerSupported && this.worker !== null;
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
