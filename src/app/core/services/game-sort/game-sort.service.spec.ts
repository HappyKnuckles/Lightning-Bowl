import { TestBed } from '@angular/core/testing';
import { GameSortService } from './game-sort.service';
import { Game } from 'src/app/core/models/game.model';
import { GameSortField, SortDirection } from 'src/app/core/models/sort.model';

describe('GameSortService', () => {
  let service: GameSortService;
  let testGames: Game[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameSortService);

    testGames = [
      {
        gameId: '1',
        date: 1640995200000, // 2022-01-01
        totalScore: 150,
        league: 'League A',
        isPractice: false,
        isClean: false,
        isPerfect: false,
        frames: {},
        frameScores: [],
        patterns: [],
        balls: []
      },
      {
        gameId: '2',
        date: 1640995260000, // 2022-01-01 (1 minute later)
        totalScore: 200,
        league: 'League B',
        isPractice: true,
        isClean: true,
        isPerfect: false,
        frames: {},
        frameScores: [],
        patterns: [],
        balls: []
      },
      {
        gameId: '3',
        date: 1640995320000, // 2022-01-01 (2 minutes later)
        totalScore: 300,
        league: 'League A',
        isPractice: false,
        isClean: true,
        isPerfect: true,
        frames: {},
        frameScores: [],
        patterns: [],
        balls: []
      }
    ];
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sort games by score ascending', () => {
    const sortOption = { field: GameSortField.TOTAL_SCORE, direction: SortDirection.ASC, label: 'Score (Low to High)' };
    const sorted = service.sortGames(testGames, sortOption);
    expect(sorted[0].totalScore).toBe(150);
    expect(sorted[1].totalScore).toBe(200);
    expect(sorted[2].totalScore).toBe(300);
  });

  it('should sort games by score descending', () => {
    const sortOption = { field: GameSortField.TOTAL_SCORE, direction: SortDirection.DESC, label: 'Score (High to Low)' };
    const sorted = service.sortGames(testGames, sortOption);
    expect(sorted[0].totalScore).toBe(300);
    expect(sorted[1].totalScore).toBe(200);
    expect(sorted[2].totalScore).toBe(150);
  });

  it('should sort games by date ascending', () => {
    const sortOption = { field: GameSortField.DATE, direction: SortDirection.ASC, label: 'Date (Oldest First)' };
    const sorted = service.sortGames(testGames, sortOption);
    expect(sorted[0].gameId).toBe('1');
    expect(sorted[1].gameId).toBe('2');
    expect(sorted[2].gameId).toBe('3');
  });

  it('should sort games by date descending', () => {
    const sortOption = { field: GameSortField.DATE, direction: SortDirection.DESC, label: 'Date (Newest First)' };
    const sorted = service.sortGames(testGames, sortOption);
    expect(sorted[0].gameId).toBe('3');
    expect(sorted[1].gameId).toBe('2');
    expect(sorted[2].gameId).toBe('1');
  });

  it('should sort games by league ascending', () => {
    const sortOption = { field: GameSortField.LEAGUE, direction: SortDirection.ASC, label: 'League (A-Z)' };
    const sorted = service.sortGames(testGames, sortOption);
    expect(sorted[0].league).toBe('League A');
    expect(sorted[1].league).toBe('League A');
    expect(sorted[2].league).toBe('League B');
  });

  it('should update selected sort option', () => {
    const newSortOption = { field: GameSortField.TOTAL_SCORE, direction: SortDirection.ASC, label: 'Score (Low to High)' };
    service.updateSelectedSort(newSortOption);
    expect(service.selectedSort()).toEqual(newSortOption);
  });
});