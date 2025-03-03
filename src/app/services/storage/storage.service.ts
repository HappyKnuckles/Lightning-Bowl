import { Injectable } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { Storage } from '@ionic/storage-angular';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { Ball } from 'src/app/models/ball.model';
import { signal } from '@angular/core';
import { LoadingService } from '../loader/loading.service';
import { BallService } from '../ball/ball.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  url = 'https://bowwwl.com';
  #leagues = signal<string[]>([]);
  #games = signal<Game[]>([]);
  #arsenal = signal<Ball[]>([]);
  #allBalls = signal<Ball[]>([]);
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

  constructor(
    private storage: Storage,
    private sortUtilsService: SortUtilsService,
    private loadingService: LoadingService,
    private ballService: BallService,
  ) {
    this.init();
  }

  async init() {
    await this.storage.create();
    await this.loadInitialData();
  }

  async loadArsenal(): Promise<void> {
    const arsenal = await this.loadData<Ball>('arsenal');
    this.arsenal.set(arsenal.reverse());
  }

  async loadLeagues(): Promise<string[]> {
    const leagues = await this.loadData<string>('league');
    this.leagues.set(leagues.reverse());
    return leagues.reverse();
  }

  async loadGameHistory(): Promise<Game[]> {
    this.loadingService.setLoading(true);
    const gameHistory = await this.loadData<Game>('game');
    this.sortUtilsService.sortGameHistoryByDate(gameHistory, false);
    this.games.set(gameHistory);
    this.loadingService.setLoading(false);
    return gameHistory;
  }

  async loadAllBalls(): Promise<void> {
    try {
      const response = await this.ballService.loadAllBalls();
      this.allBalls.set(response);
    } catch (error) {
      console.error('Failed to load all balls:', error);
    }
  }

  async saveBallToArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.save(key, ball);
    this.arsenal.update((balls) => {
      const uniqueBalls = new Set(balls.map((b) => b.ball_name));
      if (!uniqueBalls.has(ball.ball_name)) {
        return [...balls, ball];
      }
      return balls;
    });
  }

  async saveBallsToArsenal(balls: Ball[]) {
    for (const ball of balls) {
      const key = 'arsenal' + '_' + ball.ball_id;
      await this.save(key, ball);
    }
    this.arsenal.update(() => [...balls]);
  }

  async addLeague(league: string) {
    const key = 'league' + '_' + league;
    await this.save(key, league);
    this.leagues.update((leagues) => [...leagues, league]);
  }

  async saveGamesToLocalStorage(gameData: Game[]): Promise<void> {
    for (const game of gameData) {
      const key = 'game' + game.gameId;
      await this.save(key, game);
    }
    this.games.update((games) => {
      const updatedGames = [...games];
      for (const game of gameData) {
        const index = updatedGames.findIndex((g) => g.gameId === game.gameId);
        if (index !== -1) {
          updatedGames[index] = game;
        } else {
          updatedGames.unshift(game);
        }
      }
      return updatedGames;
    });
  }

  async saveGameToLocalStorage(gameData: Game): Promise<void> {
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
  }

  async removeFromArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.delete(key);
    this.arsenal.update((balls) => balls.filter((b) => b.ball_id !== ball.ball_id));
  }

  async deleteLeague(league: string) {
    const key = 'league' + '_' + league;
    await this.storage.remove(key);
    this.leagues.update((leagues) => leagues.filter((l) => l !== key.replace('league_', '')));
  }

  async deleteGame(gameId: string): Promise<void> {
    const key = 'game' + gameId;
    await this.delete(key);
    this.games.update((games) => {
      const newGames = games.filter((g) => g.gameId !== key.replace('game', ''));
      return [...newGames];
    });
  }

  async editLeague(newLeague: string, oldLeague: string) {
    const newKey = 'league' + '_' + newLeague;
    await this.deleteLeague('league' + '_' + oldLeague);
    await this.save(newKey, newLeague);
    this.leagues.update((leagues) => leagues.map((l) => (l === oldLeague ? newLeague : l)));

    const games = await this.loadData<Game>('game');
    const updatedGames = games.map((game) => {
      if (game.league === oldLeague) {
        game.league = newLeague;
      }
      return game;
    });

    await this.saveGamesToLocalStorage(updatedGames);
    this.games.set(updatedGames);
  }

  async deleteAllData(): Promise<void> {
    await this.storage.clear();
    this.games.set([]);
    this.arsenal.set([]);
    this.leagues.set([]);
  }

  private async loadInitialData() {
    await this.loadLeagues();
    await this.loadGameHistory();
    await this.loadArsenal();
    await this.loadAllBalls();
    if (this.games().length > 0) {
      localStorage.getItem('first-game');
      if (localStorage.getItem('first-game') === null) {
        localStorage.setItem('first-game', this.games()[this.games().length - 1].date.toString());
      }
    }
  }
  private async loadData<T>(prefix: string): Promise<T[]> {
    const data: T[] = [];
    await this.storage.forEach((value: T, key: string) => {
      if (key.startsWith(prefix)) {
        data.push(value);
      }
    });
    return data;
  }

  private async save(key: string, data: unknown) {
    await this.storage.set(key, data);
  }

  private async delete(key: string) {
    await this.storage.remove(key);
  }
}
