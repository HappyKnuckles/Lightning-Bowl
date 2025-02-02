import { EventEmitter, Injectable } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { Storage } from '@ionic/storage-angular';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { Ball } from 'src/app/models/ball.model';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  newGameAdded = new EventEmitter<void>();
  gameDeleted = new EventEmitter<void>();
  gameEditLeague = new EventEmitter<void>();
  gameEditHistory = new EventEmitter<void>();
  #leagues = signal<string[]>([]);
  #games = signal<Game[]>([]);
  #arsenal = signal<Ball[]>([]);
  get leagues() {
    return this.#leagues;
  }
  get games() {
    return this.#games;
  }
  get arsenal() {
    return this.#arsenal;
  }

  constructor(private storage: Storage, private sortUtilsService: SortUtilsService) {
    this.init();
  }

  async init() {
    await this.storage.create();
    await this.loadInitialData();
  }

  private async loadInitialData() {
    await this.loadLeagues();
    await this.loadGameHistory();
    await this.loadArsenal();
    if (this.games().length > 0) {
      localStorage.getItem("first-game");
      if (localStorage.getItem("first-game") === null) {
        localStorage.setItem("first-game", this.games()[this.games().length - 1].date.toString());
      }
    }
  }

  async addArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.save(key, ball);
    this.arsenal.update((balls) => [...balls, ball]);
  }

  async deleteArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.delete(key);
    this.arsenal.update((balls) => balls.filter((b) => b.ball_id !== ball.ball_id));
  }

  async addLeague(league: string) {
    const key = 'league' + '_' + league;
    await this.save(key, league);
    this.leagues.update((leagues) => [...leagues, league]);
  }

  async deleteLeague(league: string) {
    const key = 'league' + '_' + league;
    await this.storage.remove(key);
    this.leagues.update((leagues) => leagues.filter((l) => l !== key.replace('league_', '')));
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

  async saveGamesToLocalStorage(gameData: Game[], isEdit?: boolean): Promise<void> {
    for (const game of gameData) {
      const key = 'game' + game.gameId;
      await this.save(key, game);
    }
    this.games.set(gameData);
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async saveGameToLocalStorage(gameData: Game, isEdit?: boolean): Promise<void> {
    const key = 'game' + gameData.gameId;
    await this.save(key, gameData);
    this.games.update((games) => {
      const index = games.findIndex((g) => g.gameId === gameData.gameId);
      if (index !== -1) {
        return games.map((g, i) => (i === index ? gameData : g));
      } else {
        return [gameData, ...games];
      }
    });
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    const key = 'game' + gameId;
    await this.delete(key);
    this.games.update((games) => {
      const newGames = games.filter((g) => g.gameId !== key.replace('game', ''));
      return [...newGames];
    });
    this.gameDeleted.emit();
  }

  async deleteAllData(): Promise<void> {
    await this.storage.clear();
    this.games.set([]);
    this.arsenal.set([]);
    this.leagues.set([]);
    this.gameDeleted.emit();
  }

  async loadLeagues(): Promise<string[]> {
    const leagues = await this.loadData<string>('league');
    this.leagues.set(leagues.reverse());
    return leagues.reverse();
  }

  async loadArsenal(): Promise<void> {
    const arsenal = await this.loadData<Ball>('arsenal');
    this.arsenal.set(arsenal.reverse());
  }

  async loadGameHistory(): Promise<Game[]> {
    const gameHistory = await this.loadData<Game>('game');
    this.sortUtilsService.sortGameHistoryByDate(gameHistory);
    this.games.set(gameHistory);
    return gameHistory;
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

  private async save(key: string, data: any) {
    await this.storage.set(key, data);
  }

  private async delete(key: string) {
    await this.storage.remove(key);
  }
}
