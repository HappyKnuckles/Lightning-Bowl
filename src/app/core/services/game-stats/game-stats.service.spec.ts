import { TestBed } from '@angular/core/testing';
import { GameStatsService } from './game-stats.service';
import { GameFilterService } from '../game-filter/game-filter.service';
import { UtilsService } from '../utils/utils.service';
import { StorageService } from '../storage/storage.service';
import { Game } from 'src/app/core/models/game.model';
import { Stats } from 'src/app/core/models/stats.model';

describe('GameStatsService', () => {
  let service: GameStatsService;
  let mockGameFilterService: jasmine.SpyObj<GameFilterService>;
  let mockUtilsService: jasmine.SpyObj<UtilsService>;
  let mockStorageService: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    const gameFilterSpy = jasmine.createSpyObj('GameFilterService', ['filterGames']);
    const utilsSpy = jasmine.createSpyObj('UtilsService', ['isSameDay', 'isDayBefore']);
    const storageSpy = jasmine.createSpyObj('StorageService', [], {
      games: jasmine.createSpy().and.returnValue([])
    });

    TestBed.configureTestingModule({
      providers: [
        GameStatsService,
        { provide: GameFilterService, useValue: gameFilterSpy },
        { provide: UtilsService, useValue: utilsSpy },
        { provide: StorageService, useValue: storageSpy }
      ]
    });

    service = TestBed.inject(GameStatsService);
    mockGameFilterService = TestBed.inject(GameFilterService) as jasmine.SpyObj<GameFilterService>;
    mockUtilsService = TestBed.inject(UtilsService) as jasmine.SpyObj<UtilsService>;
    mockStorageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateBowlingStats', () => {
    it('should calculate stats for empty game history', () => {
      const gameHistory: Game[] = [];
      const stats = service.calculateBowlingStats(gameHistory);
      
      expect(stats.totalGames).toBe(0);
      expect(stats.totalPins).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.highGame).toBe(0);
      expect(stats.totalStrikes).toBe(0);
      expect(stats.totalSpares).toBe(0);
    });

    it('should calculate stats for single game with all strikes', () => {
      const gameHistory: Game[] = [
        createMockGame({
          totalScore: 300,
          frames: [[10], [10], [10], [10], [10], [10], [10], [10], [10], [10, 10, 10]],
          frameScores: [30, 60, 90, 120, 150, 180, 210, 240, 270, 300]
        })
      ];

      const stats = service.calculateBowlingStats(gameHistory);

      expect(stats.totalGames).toBe(1);
      expect(stats.totalPins).toBe(300);
      expect(stats.averageScore).toBe(300);
      expect(stats.highGame).toBe(300);
      expect(stats.totalStrikes).toBe(12); // 10 regular frames + 2 bonus in 10th
      expect(stats.totalSpares).toBe(0);
      expect(stats.perfectGameCount).toBe(1);
      expect(stats.strikePercentage).toBeCloseTo(100, 1);
    });

    it('should calculate stats for single game with all spares', () => {
      const gameHistory: Game[] = [
        createMockGame({
          totalScore: 150,
          frames: [[5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5, 5]],
          frameScores: [15, 30, 45, 60, 75, 90, 105, 120, 135, 150]
        })
      ];

      const stats = service.calculateBowlingStats(gameHistory);

      expect(stats.totalGames).toBe(1);
      expect(stats.totalPins).toBe(150);
      expect(stats.averageScore).toBe(150);
      expect(stats.totalStrikes).toBe(0);
      expect(stats.totalSparesConverted).toBe(10);
      expect(stats.perfectGameCount).toBe(0);
      expect(stats.sparePercentage).toBeCloseTo(100, 1);
    });

    it('should calculate stats for mixed game', () => {
      const gameHistory: Game[] = [
        createMockGame({
          totalScore: 150,
          frames: [[10], [5, 5], [3, 4], [10], [7, 2], [3, 7], [10], [10], [9, 1], [5, 3]],
          frameScores: [20, 35, 42, 61, 70, 90, 119, 138, 153, 161]
        })
      ];

      const stats = service.calculateBowlingStats(gameHistory);

      expect(stats.totalGames).toBe(1);
      expect(stats.totalStrikes).toBeGreaterThan(0);
      expect(stats.totalSparesConverted).toBeGreaterThan(0);
      expect(stats.totalSparesMissed).toBeGreaterThan(0);
    });

    it('should calculate stats for multiple games', () => {
      const gameHistory: Game[] = [
        createMockGame({ totalScore: 200, date: Date.now() - 86400000 }),
        createMockGame({ totalScore: 150, date: Date.now() - 172800000 }),
        createMockGame({ totalScore: 180, date: Date.now() - 259200000 })
      ];

      const stats = service.calculateBowlingStats(gameHistory);

      expect(stats.totalGames).toBe(3);
      expect(stats.averageScore).toBeCloseTo(176.67, 1);
      expect(stats.highGame).toBe(200);
    });
  });

  describe('calculateBestBallStats', () => {
    it('should calculate best ball stats from game history', () => {
      const gameHistory: Game[] = [
        createMockGame({
          balls: ['Storm Phaze II'],
          totalScore: 200
        }),
        createMockGame({
          balls: ['Storm Phaze II'],
          totalScore: 220
        }),
        createMockGame({
          balls: ['Brunswick Quantum'],
          totalScore: 180
        })
      ];

      const bestBallStats = service.calculateBestBallStats(gameHistory);
      expect(bestBallStats.ballName).toBe('Storm Phaze II');
      expect(bestBallStats.ballAvg).toBe(210);
      expect(bestBallStats.gameCount).toBe(2);
    });

    it('should return default stats for empty game history', () => {
      const bestBallStats = service.calculateBestBallStats([]);
      expect(bestBallStats.ballName).toBe('');
      expect(bestBallStats.ballAvg).toBe(0);
      expect(bestBallStats.gameCount).toBe(0);
    });
  });

  describe('calculateMostPlayedBall', () => {
    it('should calculate most played ball from game history', () => {
      const gameHistory: Game[] = [
        createMockGame({ balls: ['Storm Phaze II'] }),
        createMockGame({ balls: ['Storm Phaze II'] }),
        createMockGame({ balls: ['Storm Phaze II'] }),
        createMockGame({ balls: ['Brunswick Quantum'] })
      ];

      const mostPlayedStats = service.calculateMostPlayedBall(gameHistory);
      expect(mostPlayedStats.ballName).toBe('Storm Phaze II');
      expect(mostPlayedStats.gameCount).toBe(3);
    });
  });

  describe('calculateGamesForTargetAverage', () => {
    it('should calculate games needed for target average', () => {
      const results = service.calculateGamesForTargetAverage(180, 5);
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
        expect(result.gamesNeeded).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle edge case of zero target average', () => {
      const results = service.calculateGamesForTargetAverage(0);
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('calculateSeriesStats', () => {
    it('should calculate series statistics', () => {
      const gameHistory: Game[] = [
        createMockGame({ seriesId: 'series1', totalScore: 200 }),
        createMockGame({ seriesId: 'series1', totalScore: 180 }),
        createMockGame({ seriesId: 'series1', totalScore: 220 }),
        createMockGame({ seriesId: 'series2', totalScore: 160 }),
        createMockGame({ seriesId: 'series2', totalScore: 170 }),
        createMockGame({ seriesId: 'series2', totalScore: 150 })
      ];

      const seriesStats = service.calculateSeriesStats(gameHistory);
      
      expect(seriesStats.average3SeriesScore).toBeGreaterThan(0);
      expect(seriesStats.high3Series).toBeGreaterThan(0);
    });
  });

  // Helper function to create mock games
  function createMockGame(overrides: Partial<Game> = {}): Game {
    const defaultGame: Game = {
      gameId: 'test-' + Math.random(),
      date: Date.now(),
      totalScore: 150,
      frameScores: [15, 30, 45, 60, 75, 90, 105, 120, 135, 150],
      frames: [[5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5], [5, 5, 5]],
      isPractice: false,
      league: '',
      patterns: [],
      balls: ['Test Ball'],
      note: '',
      isSeries: false,
      seriesId: undefined,
      isClean: false,
      isPerfect: false
    };

    return { ...defaultGame, ...overrides };
  }
});
