import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';
import { LeagueData } from 'src/app/core/models/league.model';

@Injectable({
  providedIn: 'root',
})
export class SortUtilsService {
  // Helper method to get league name from LeagueData
  private getLeagueName(league: LeagueData | undefined): string {
    if (!league) return '';
    return typeof league === 'string' ? league : league.name;
  }

  sortGameHistoryByDate(gameHistory: Game[], ascending = false): Game[] {
    return gameHistory.sort((a: { date: number }, b: { date: number }) => {
      if (ascending) {
        return a.date - b.date;
      } else return b.date - a.date;
    });
  }

  sortGamesByLeagues(games: Game[], includePractice?: boolean): Record<string, Game[]> {
    const gamesByLeague = games.reduce((acc: Record<string, Game[]>, game: Game) => {
      const leagueName = this.getLeagueName(game.league);
      const league = leagueName || (includePractice ? 'Practice' : '');
      if (!league) return acc;
      if (!acc[league]) {
        acc[league] = [];
      }
      acc[league].push(game);
      return acc;
    }, {});

    const sortedEntries = Object.entries(gamesByLeague).sort((a, b) => b[1].length - a[1].length);

    return sortedEntries.reduce((acc: Record<string, Game[]>, [league, games]) => {
      acc[league] = games;
      return acc;
    }, {});
  }
}
