import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { Storage } from '@ionic/storage-angular';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { Ball } from 'src/app/core/models/ball.model';
import { signal } from '@angular/core';
import { LoadingService } from '../loader/loading.service';
import { BallService } from '../ball/ball.service';
import { Pattern } from '../../models/pattern.model';
import { PatternService } from '../pattern/pattern.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  url = 'https://bowwwl.com';
  #leagues = signal<string[]>([]);
  #games = signal<Game[]>([]);
  #arsenal = signal<Ball[]>([]);
  #allBalls = signal<Ball[]>([]);
  #allPatterns = signal<Partial<Pattern>[]>([]);

  get leagues() {
    return this.#leagues;
  }
  get games() {
    return this.#games;
  }
  get arsenal() {
    return this.#arsenal;
  }
  get allBalls() {
    return this.#allBalls;
  }
  get allPatterns() {
    return this.#allPatterns;
  }

  constructor(
    private storage: Storage,
    private sortUtilsService: SortUtilsService,
    private loadingService: LoadingService,
    private ballService: BallService,
    private patternService: PatternService,
  ) {
    this.init();
  }

  async init() {
    try {
      await this.storage.create();

      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const requested = await navigator.storage.persist();
          if (!requested) {
            console.warn('Persistent storage request was denied or not granted.');
          }
        }
      } else {
        console.warn('Persistent Storage API is not supported by this browser.');
      }

      const ballFilter = localStorage.getItem('ball-filter');
      // Ensure weight is treated as a number if needed, adjust default as necessary
      const weight = ballFilter ? parseInt(JSON.parse(ballFilter).weight, 10) : 15;
      await this.loadInitialData(weight);
    } catch (error) {
      console.error('Error during StorageService init:', error);
      // Optionally rethrow or handle further if needed
    }
  }

  async loadArsenal(): Promise<void> {
    try {
      const arsenal = await this.loadData<Ball>('arsenal');
      const sortedArsenal = arsenal.sort((a, b) => (a.position || arsenal.length + 1) - (b.position || arsenal.length + 1));
      this.arsenal.set(sortedArsenal);
    } catch (error) {
      console.error('Error loading arsenal:', error);
      throw error;
    }
  }

  async loadLeagues(): Promise<string[]> {
    try {
      const leagues = await this.loadData<string>('league');
      this.leagues.set(leagues.reverse());
      return leagues.reverse();
    } catch (error) {
      console.error('Error loading leagues:', error);
      throw error;
    }
  }

  async loadGameHistory(): Promise<Game[]> {
    this.loadingService.setLoading(true);
    try {
      const gameHistory = await this.loadData<Game>('game');
      let needsUpdate = false;

      // Temporary transformation: convert legacy single pattern string to patterns array
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

        // Remove old pattern property if it still exists
        if (legacyGame.pattern !== undefined) {
          delete legacyGame.pattern;
          needsUpdate = true;
        }

        // Sort patterns and balls arrays alphabetically and check if they were already sorted
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

      // Save updated games back to storage if any changes were made
      if (needsUpdate) {
        await this.saveGamesToLocalStorage(gameHistory);
      }

      this.sortUtilsService.sortGameHistoryByDate(gameHistory, false);
      this.games.set(gameHistory);
      return gameHistory;
    } catch (error) {
      console.error('Error loading game history:', error);
      throw error;
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async loadAllBalls(updated?: string, weight?: number): Promise<void> {
    try {
      const response = await this.ballService.loadAllBalls(updated, weight);
      this.allBalls.set(response);
    } catch (error) {
      console.error('Failed to load all balls:', error);
      throw error;
    }
  }

  async loadAllPatterns(): Promise<void> {
    try {
      const response = await this.patternService.getAllPatterns();
      const patterns = response;
      this.allPatterns.set(patterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
    }
  }

  async saveBallToArsenal(ball: Ball) {
    try {
      const key = 'arsenal' + '_' + ball.ball_id + '_' + ball.core_weight;
      await this.save(key, ball);
      this.arsenal.update((balls) => {
        const isUnique = !balls.some((b) => b.ball_id === ball.ball_id && b.core_weight === ball.core_weight);
        if (isUnique) {
          return [...balls, ball];
        }
        return balls;
      });
    } catch (error) {
      console.error('Error saving ball to arsenal:', error);
      throw error;
    }
  }

  async saveBallsToArsenal(balls: Ball[]) {
    try {
      for (const ball of balls) {
        const key = 'arsenal' + '_' + ball.ball_id + '_' + ball.core_weight;
        await this.save(key, ball);
      }
      this.arsenal.update(() => [...balls]);
    } catch (error) {
      console.error('Error saving balls to arsenal:', error);
      throw error;
    }
  }

  async addLeague(league: string) {
    try {
      const key = 'league' + '_' + league;
      await this.save(key, league);
      this.leagues.update((leagues) => [...leagues, league]);
    } catch (error) {
      console.error('Error adding league:', error);
      throw error;
    }
  }

  async saveGamesToLocalStorage(gameData: Game[]): Promise<void> {
    try {
      // Save all games in parallel
      await Promise.all(gameData.map((game) => this.save('game' + game.gameId, game)));

      // Efficient signal update
      this.games.update((games) => {
        const existingMap = new Map(games.map((g) => [g.gameId, g]));
        for (const game of gameData) {
          existingMap.set(game.gameId, game);
        }

        // Keep new/updated games at top
        const updatedIds = new Set(gameData.map((g) => g.gameId));
        const others = games.filter((g) => !updatedIds.has(g.gameId));
        return [...gameData, ...others];
      });
    } catch (error) {
      console.error('Error saving games to local storage:', error);
      throw error;
    }
  }

  async saveGameToLocalStorage(gameData: Game): Promise<void> {
    try {
      const key = 'game' + gameData.gameId;
      await this.save(key, gameData);
      this.games.update((games) => {
        const index = games.findIndex((game) => game.gameId === gameData.gameId);
        if (index !== -1) {
          return games.map((game, i) => (i === index ? gameData : game));
        } else {
          return [gameData, ...games];
        }
      });
    } catch (error) {
      console.error('Error saving game to local storage:', error);
      throw error;
    }
  }

  async removeFromArsenal(ball: Ball) {
    try {
      const key = 'arsenal' + '_' + ball.ball_id + '_' + ball.core_weight;
      await this.delete('arsenal' + '_' + ball.ball_id);
      await this.delete(key);
      this.arsenal.update((balls) => balls.filter((b) => !(b.ball_id === ball.ball_id && b.core_weight === ball.core_weight)));
    } catch (error) {
      console.error('Error removing ball from arsenal:', error);
      throw error;
    }
  }

  async deleteLeague(league: string) {
    try {
      const key = 'league' + '_' + league;
      await this.storage.remove(key);
      this.leagues.update((leagues) => leagues.filter((l) => l !== key.replace('league_', '')));
    } catch (error) {
      console.error('Error deleting league:', error);
      throw error;
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    try {
      const key = 'game' + gameId;
      await this.delete(key);
      this.games.update((games) => {
        const newGames = games.filter((g) => g.gameId !== key.replace('game', ''));
        return [...newGames];
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }

  async editLeague(newLeague: string, oldLeague: string) {
    try {
      await this.deleteLeague(oldLeague);
      await this.addLeague(newLeague);
      const games = await this.loadData<Game>('game');
      const updatedGames = games.map((game) => {
        if (game.league === oldLeague) {
          game.league = newLeague;
        }
        return game;
      });

      await this.saveGamesToLocalStorage(updatedGames);
      this.games.set(updatedGames);
    } catch (error) {
      console.error('Error editing league:', error);
      throw error;
    }
  }

  async deleteAllData(): Promise<void> {
    try {
      await this.storage.clear();
      this.games.set([]);
      this.arsenal.set([]);
      this.leagues.set([]);
    } catch (error) {
      console.error('Error deleting all data:', error);
      throw error;
    }
  }

  private async loadInitialData(weight: number): Promise<void> {
    try {
      await Promise.all([
        this.loadAllPatterns(),
        this.loadAllBalls(undefined, weight),
        this.loadLeagues(),
        this.loadGameHistory(),
        this.loadArsenal(),
        this.ballService.getBrands(),
        this.ballService.getCores(),
        this.ballService.getCoverstocks(),
      ]);
      if (this.games().length > 0) {
        if (localStorage.getItem('first-game') === null) {
          localStorage.setItem('first-game', this.games()[this.games().length - 1].date.toString());
        }
      }
    } catch (error) {
      console.error('Error during initial data load:', error);
      throw error;
    }
  }

  private async loadData<T>(prefix: string): Promise<T[]> {
    try {
      const data: T[] = [];
      await this.storage.forEach((value: T, key: string) => {
        if (key.startsWith(prefix)) {
          data.push(value);
        }
      });
      return data;
    } catch (error) {
      console.error(`Error loading data for prefix "${prefix}":`, error);
      throw error;
    }
  }

  private async save(key: string, data: unknown) {
    try {
      await this.storage.set(key, data);
    } catch (error) {
      console.error(`Error saving data for key "${key}":`, error);
      throw error;
    }
  }

  private async delete(key: string) {
    try {
      await this.storage.remove(key);
    } catch (error) {
      console.error(`Error deleting data for key "${key}":`, error);
      throw error;
    }
  }
}
