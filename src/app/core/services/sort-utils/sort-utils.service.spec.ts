import { TestBed } from '@angular/core/testing';
import { SortUtilsService } from './sort-utils.service';
import { Game } from 'src/app/core/models/game.model';

describe('SortUtilsService', () => {
  let service: SortUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SortUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sortGameHistoryByDate', () => {
    const createMockGame = (date: number, gameId: string = 'test'): Game => ({
      gameId,
      date,
      totalScore: 150,
      frameScores: [],
      frames: [],
      isPractice: false,
      league: '',
      patterns: [],
      balls: [],
      isClean: false,
      isPerfect: false
    });

    it('should sort games by date descending by default', () => {
      const games = [
        createMockGame(1000, 'oldest'),
        createMockGame(3000, 'newest'),
        createMockGame(2000, 'middle')
      ];

      const sorted = service.sortGameHistoryByDate(games);

      expect(sorted[0].gameId).toBe('newest');
      expect(sorted[1].gameId).toBe('middle');
      expect(sorted[2].gameId).toBe('oldest');
    });

    it('should sort games by date ascending when specified', () => {
      const games = [
        createMockGame(3000, 'newest'),
        createMockGame(1000, 'oldest'),
        createMockGame(2000, 'middle')
      ];

      const sorted = service.sortGameHistoryByDate(games, true);

      expect(sorted[0].gameId).toBe('oldest');
      expect(sorted[1].gameId).toBe('middle');
      expect(sorted[2].gameId).toBe('newest');
    });

    it('should handle empty array', () => {
      const result = service.sortGameHistoryByDate([]);
      expect(result).toEqual([]);
    });

    it('should handle single game', () => {
      const game = createMockGame(1000, 'single');
      const result = service.sortGameHistoryByDate([game]);
      expect(result).toEqual([game]);
    });
  });

  describe('sortGamesByLeagues', () => {
    const createMockGameWithLeague = (league?: string, isPractice = false): Game => ({
      gameId: Math.random().toString(),
      date: Date.now(),
      totalScore: 150,
      frameScores: [],
      frames: [],
      isPractice,
      league: league || '',
      patterns: [],
      balls: [],
      isClean: false,
      isPerfect: false
    });

    it('should group games by league and sort by count descending', () => {
      const games = [
        createMockGameWithLeague('League A'),
        createMockGameWithLeague('League A'),
        createMockGameWithLeague('League A'),
        createMockGameWithLeague('League B'),
        createMockGameWithLeague('League B'),
        createMockGameWithLeague('League C'),
      ];

      const result = service.sortGamesByLeagues(games);
      const leagueNames = Object.keys(result);

      expect(leagueNames[0]).toBe('League A'); // 3 games
      expect(leagueNames[1]).toBe('League B'); // 2 games
      expect(leagueNames[2]).toBe('League C'); // 1 game

      expect(result['League A'].length).toBe(3);
      expect(result['League B'].length).toBe(2);
      expect(result['League C'].length).toBe(1);
    });

    it('should handle games with no league when includePractice is false', () => {
      const games = [
        createMockGameWithLeague('League A'),
        createMockGameWithLeague(), // no league
        createMockGameWithLeague(), // no league
      ];

      const result = service.sortGamesByLeagues(games, false);

      expect(Object.keys(result)).toEqual(['League A']);
      expect(result['League A'].length).toBe(1);
    });

    it('should include practice games when includePractice is true', () => {
      const games = [
        createMockGameWithLeague('League A'),
        createMockGameWithLeague(), // no league - should be practice
        createMockGameWithLeague(), // no league - should be practice
      ];

      const result = service.sortGamesByLeagues(games, true);

      expect(Object.keys(result).sort()).toEqual(['League A', 'Practice']);
      expect(result['Practice'].length).toBe(2);
      expect(result['League A'].length).toBe(1);
    });

    it('should handle empty games array', () => {
      const result = service.sortGamesByLeagues([]);
      expect(result).toEqual({});
    });
  });
});
