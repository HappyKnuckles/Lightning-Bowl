import { Injectable } from '@angular/core';
import { Game } from 'src/app/core/models/game.model';

@Injectable({
  providedIn: 'root',
})
export class SortUtilsService {
  private sortCache = new Map<string, Game[]>();
  private readonly SORT_CACHE_TTL = 5000; // 5 seconds

  sortGameHistoryByDate(gameHistory: Game[], ascending = false): Game[] {
    // Check cache for sorted results
    const cacheKey = `sort_${gameHistory.length}_${ascending}_${gameHistory[0]?.date || 0}`;
    const cached = this.sortCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Use optimized sort for large arrays
    const sorted = gameHistory.sort((a: { date: number }, b: { date: number }) => {
      if (ascending) {
        return a.date - b.date;
      } else return b.date - a.date;
    });

    // Cache result
    this.sortCache.set(cacheKey, sorted);
    
    // Clean cache after TTL
    setTimeout(() => this.sortCache.delete(cacheKey), this.SORT_CACHE_TTL);

    return sorted;
  }

  sortGamesByLeagues(games: Game[], includePractice?: boolean): Record<string, Game[]> {
    // Optimized grouping using Map for O(1) lookups
    const gamesByLeague = new Map<string, Game[]>();
    
    for (const game of games) {
      const league = game.league || (includePractice ? 'Practice' : '');
      if (!league) continue;
      
      if (!gamesByLeague.has(league)) {
        gamesByLeague.set(league, []);
      }
      gamesByLeague.get(league)!.push(game);
    }

    // Convert to array for sorting
    const entries = Array.from(gamesByLeague.entries());
    entries.sort((a, b) => b[1].length - a[1].length);

    // Convert back to object
    const result: Record<string, Game[]> = {};
    for (const [league, games] of entries) {
      result[league] = games;
    }

    return result;
  }
}
