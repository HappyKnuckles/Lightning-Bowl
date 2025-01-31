import { EventEmitter, Injectable, signal } from '@angular/core';
import { Game } from 'src/app/models/game.model';
import { Storage } from '@ionic/storage-angular';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { Ball } from 'src/app/models/ball.model';
import { sign } from 'crypto';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  newGameAdded = new EventEmitter<void>();
  gameDeleted = new EventEmitter<void>();
  gameEditLeague = new EventEmitter<void>();
  gameEditHistory = new EventEmitter<void>();
  newLeagueAdded = new EventEmitter<void>();
  leagueDeleted = new EventEmitter<void>();
  leagueChanged = new EventEmitter<void>();
  #arsenal = signal<Ball[]>([]);
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
    const arsenal = await this.loadArsenal();
    this.arsenal.set(arsenal);
  }
  
  async loadArsenal(): Promise<Ball[]> {
    const arsenal = await this.loadData<Ball>('arsenal');
    return arsenal.reverse();
  }

  async addArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.save(key, ball);
    this.arsenal.update(balls => [...balls, ball]);

  }

  async deleteArsenal(ball: Ball) {
    const key = 'arsenal' + '_' + ball.ball_id;
    await this.delete(key);
    this.arsenal.update(balls => balls.filter(b => b.ball_id !== ball.ball_id));

  }

  async addLeague(league: string, isEdit?: boolean) {
    const key = 'league' + '_' + league;
    await this.save(key, league);
    if (!isEdit) {
      this.newLeagueAdded.emit();
    }
  }

  async deleteLeague(league: string, isEdit?: boolean) {
    const key = 'league' + '_' + league;
    await this.storage.remove(key);
    if (!isEdit) {
      this.leagueDeleted.emit();
    }
  }

  async editLeague(newLeague: string, oldLeague: string) {
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

    this.leagueChanged.emit();
  }

  async saveGamesToLocalStorage(gameData: Game[], isEdit?: boolean): Promise<void> {
    for (const game of gameData) {
      const key = 'game' + game.gameId;
      await this.save(key, game);
    }
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async saveGameToLocalStorage(gameData: Game, isEdit?: boolean): Promise<void> {
    const key = 'game' + gameData.gameId;
    await this.save(key, gameData);
    if (!isEdit) {
      this.newGameAdded.emit();
    }
  }

  async deleteGame(gameId: string): Promise<void> {
    const key = 'game' + gameId;
    await this.delete(key);
    this.gameDeleted.emit();
  }

  async deleteAllData(): Promise<void> {
    await this.storage.clear();
    this.gameDeleted.emit();
  }

  async loadLeagues(): Promise<string[]> {
    const leagues = await this.loadData<string>('league');
    return leagues.reverse();
  }

  async loadGameHistory(): Promise<Game[]> {
    const gameHistory = await this.loadData<Game>('game');
    this.sortUtilsService.sortGameHistoryByDate(gameHistory);
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

// import { EventEmitter, Injectable } from '@angular/core';
// import { Game } from 'src/app/models/game.model';
// import { Storage } from '@ionic/storage-angular';
// import { SortUtilsService } from '../sort-utils/sort-utils.service';
// import { Ball } from 'src/app/models/ball.model';
// import { signal } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class StorageService {
//   newGameAdded = new EventEmitter<void>();
//   gameDeleted = new EventEmitter<void>();
//   gameEditLeague = new EventEmitter<void>();
//   gameEditHistory = new EventEmitter<void>();
//   newLeagueAdded = new EventEmitter<void>();
//   leagueDeleted = new EventEmitter<void>();
//   leagueChanged = new EventEmitter<void>();

//   leagues = signal<string[]>([]);
//   games = signal<Game[]>([]);
//   balls = signal<Ball[]>([]);

//   constructor(private storage: Storage, private sortUtilsService: SortUtilsService) {
//     this.init();
//   }

//   async init() {
//     await this.storage.create();
//     await this.loadInitialData();
//   }

//   private async loadInitialData() {
//     const leagues = await this.loadLeagues();
//     this.leagues.set(leagues);

//     const games = await this.loadGameHistory();
//     this.games.set(games);

//     const balls = await this.loadArsenal();
//     this.balls.set(balls);
//   }

//   async loadArsenal(): Promise<Ball[]> {
//     const arsenal = await this.loadData<Ball>('arsenal');
//     return arsenal.reverse();
//   }

//   async addArsenal(ball: Ball) {
//     const key = 'arsenal' + '_' + ball.ball_id;
//     await this.save(key, ball);
//     this.balls.update(balls => [...balls, ball]);
//   }

//   async deleteArsenal(ball: Ball) {
//     const key = 'arsenal' + '_' + ball.ball_id;
//     await this.delete(key);
//     this.balls.update(balls => balls.filter(b => b.ball_id !== ball.ball_id));
//   }

//   async addLeague(league: string) {
//     const key = 'league' + '_' + league;
//     await this.save(key, league);
//     this.leagues.update(leagues => [...leagues, league]);
//     this.newLeagueAdded.emit();
//   }

//   async deleteLeague(key: string) {
//     await this.storage.remove(key);
//     this.leagues.update(leagues => leagues.filter(l => l !== key.replace('league_', '')));
//     this.leagueDeleted.emit();
//   }

//   async editLeague(newLeague: string, oldLeague: string) {
//     const newKey = 'league' + '_' + newLeague;
//     await this.deleteLeague('league' + '_' + oldLeague);
//     await this.save(newKey, newLeague);
//     this.leagues.update(leagues => leagues.map(l => l === oldLeague ? newLeague : l));
//     const games = await this.loadData<Game>('game');
//     const updatedGames = games.map((game) => {
//       if (game.league === oldLeague) {
//         game.league = newLeague;
//       }
//       return game;
//     });
//     await this.saveGamesToLocalStorage(updatedGames);
//     this.games.set(updatedGames);
//     this.leagueChanged.emit();
//   }

//   async saveGamesToLocalStorage(gameData: Game[], isEdit?: boolean): Promise<void> {
//     for (const game of gameData) {
//       const key = 'game' + game.gameId;
//       await this.save(key, game);
//     }
//     this.games.set(gameData);
//     if (!isEdit) {
//       this.newGameAdded.emit();
//     }
//   }

//   async saveGameToLocalStorage(gameData: Game, isEdit?: boolean): Promise<void> {
//     const key = 'game' + gameData.gameId;
//     await this.save(key, gameData);
//     this.games.update(games => {
//       const index = games.findIndex(g => g.gameId === gameData.gameId);
//       if (index !== -1) {
//         games[index] = gameData;
//       } else {
//         games.push(gameData);
//       }
//       return games;
//     });
//     if (!isEdit) {
//       this.newGameAdded.emit();
//     }
//   }

//   async deleteGame(key: string): Promise<void> {
//     await this.delete(key);
//     this.games.update(games => games.filter(g => g.gameId !== key.replace('game', '')));
//     this.gameDeleted.emit();
//   }

//   async deleteAllData(): Promise<void> {
//     await this.storage.clear();
//     this.games.set([]);
//     this.balls.set([]);
//     this.leagues.set([]);
//     this.gameDeleted.emit();
//   }

//   async loadLeagues(): Promise<string[]> {
//     const leagues = await this.loadData<string>('league');
//     return leagues.reverse();
//   }

//   async loadGameHistory(): Promise<Game[]> {
//     const gameHistory = await this.loadData<Game>('game');

//     // TODO remove this block after a while
//     let isRenewed = localStorage.getItem('isRenewedAgainAgain') || false;
//     if (!isRenewed) {
//       gameHistory.forEach((game) => {
//         game.isPerfect = game.totalScore === 300;
//         game.isSeries = game.seriesId !== undefined;
//         game.isClean = game.frames.every((frame: { throws: any[] }) => {
//           const frameTotal = frame.throws.reduce((sum: any, currentThrow: { value: any }) => sum + currentThrow.value, 0);
//           return frameTotal >= 10;
//         });
//         if (game.league === undefined || game.league === '') {
//           game.isPractice = true;
//         } else game.isPractice = false;
//       });

//       this.saveGamesToLocalStorage(gameHistory);
//       isRenewed = true;
//       localStorage.setItem('isRenewedAgainAgain', JSON.stringify(isRenewed));
//     }
//     this.sortUtilsService.sortGameHistoryByDate(gameHistory);

//     return gameHistory;
//   }

//   private async loadData<T>(prefix: string): Promise<T[]> {
//     const data: T[] = [];
//     await this.storage.forEach((value: T, key: string) => {
//       if (key.startsWith(prefix)) {
//         data.push(value);
//       }
//     });
//     return data;
//   }

//   private async save(key: string, data: any) {
//     await this.storage.set(key, data);
//   }

//   private async delete(key: string) {
//     await this.storage.remove(key);
//   }
// }