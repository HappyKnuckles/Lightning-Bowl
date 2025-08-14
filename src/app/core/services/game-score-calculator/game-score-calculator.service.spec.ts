import { TestBed } from '@angular/core/testing';

import { GameScoreCalculatorService } from './game-score-calculator.service';

describe('GameScoreCalculatorService', () => {
  let service: GameScoreCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameScoreCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateScore', () => {
    it('should calculate score for a perfect game (all strikes)', () => {
      const frames = [
        [10], [10], [10], [10], [10],
        [10], [10], [10], [10], [10, 10, 10]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(300);
      expect(result.frameScores[9]).toBe(300);
    });

    it('should calculate score for all spares', () => {
      const frames = [
        [5, 5], [5, 5], [5, 5], [5, 5], [5, 5],
        [5, 5], [5, 5], [5, 5], [5, 5], [5, 5, 5]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(150);
      expect(result.frameScores[9]).toBe(150);
    });

    it('should calculate score for open frames', () => {
      const frames = [
        [3, 4], [3, 4], [3, 4], [3, 4], [3, 4],
        [3, 4], [3, 4], [3, 4], [3, 4], [3, 4]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(70);
      expect(result.frameScores[9]).toBe(70);
    });

    it('should calculate score for mixed game with strikes, spares, and opens', () => {
      const frames = [
        [10], [5, 5], [3, 4], [10], [7, 2],
        [3, 7], [10], [10], [9, 1], [10, 10, 10]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(187);
    });

    it('should handle tenth frame with strike followed by two strikes', () => {
      const frames = [
        [7, 2], [7, 2], [7, 2], [7, 2], [7, 2],
        [7, 2], [7, 2], [7, 2], [7, 2], [10, 10, 10]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(111);
    });

    it('should handle tenth frame with spare', () => {
      const frames = [
        [7, 2], [7, 2], [7, 2], [7, 2], [7, 2],
        [7, 2], [7, 2], [7, 2], [7, 2], [9, 1, 7]
      ];
      const result = service.calculateScore(frames);
      expect(result.totalScore).toBe(98);
    });
  });

  describe('calculateMaxScore', () => {
    it('should calculate max score for a full game with various scenarios', () => {
      const frames = [
        [10], [5, 5], [3, 4], [10], [7, 2],
        [3, 7], [10], [10], [9, 1]
      ];
      const maxScore = service.calculateMaxScore(frames, 177);
      expect(maxScore).toBeGreaterThan(0);
      expect(maxScore).toBeLessThanOrEqual(300);
    });

    it('should calculate max score for early game', () => {
      const frames = [
        [10], [5, 5]
      ];
      const maxScore = service.calculateMaxScore(frames, 20);
      expect(maxScore).toBeGreaterThan(20);
      expect(maxScore).toBeLessThanOrEqual(300);
    });

    it('should return 300 for no frames played', () => {
      const frames: number[][] = [];
      const maxScore = service.calculateMaxScore(frames, 0);
      expect(maxScore).toBe(300);
    });

    it('should handle perfect game in progress', () => {
      const frames = [
        [10], [10], [10], [10], [10],
        [10], [10], [10], [10]
      ];
      const maxScore = service.calculateMaxScore(frames, 240);
      expect(maxScore).toBe(300);
    });
  });

  describe('getSeriesScore', () => {
    it('should calculate series score for 3 games', () => {
      const scores = [0, 150, 180, 200];
      const seriesScore = service.getSeriesScore(1, scores);
      expect(seriesScore).toBe(530); // 150 + 180 + 200
    });

    it('should calculate series score for 4 games', () => {
      const scores = [0, 0, 0, 0, 150, 180, 200, 170];
      const seriesScore = service.getSeriesScore(2, scores);
      expect(seriesScore).toBe(700); // 150 + 180 + 200 + 170
    });

    it('should return default value for invalid series index', () => {
      const scores = [150, 180, 200];
      const seriesScore = service.getSeriesScore(99, scores, 100);
      expect(seriesScore).toBe(100);
    });

    it('should handle missing scores in array', () => {
      const scores = [0, 150, undefined, 200] as number[];
      const seriesScore = service.getSeriesScore(1, scores);
      expect(seriesScore).toBe(350); // 150 + 0 + 200
    });
  });

  describe('getSeriesMaxScore', () => {
    it('should return max score for series with default 900', () => {
      const maxScores = [280, 290, 300];
      const seriesMaxScore = service.getSeriesMaxScore(1, maxScores);
      expect(seriesMaxScore).toBe(870); // 280 + 290 + 300
    });

    it('should return default 900 for invalid series', () => {
      const maxScores = [280, 290, 300];
      const seriesMaxScore = service.getSeriesMaxScore(99, maxScores);
      expect(seriesMaxScore).toBe(900);
    });
  });

  describe('getSeriesCurrentScore', () => {
    it('should return current score for series', () => {
      const totalScores = [150, 180, 200];
      const seriesCurrentScore = service.getSeriesCurrentScore(1, totalScores);
      expect(seriesCurrentScore).toBe(530);
    });

    it('should return 0 for invalid series', () => {
      const totalScores = [150, 180, 200];
      const seriesCurrentScore = service.getSeriesCurrentScore(99, totalScores);
      expect(seriesCurrentScore).toBe(0);
    });
  });

  describe('private methods via public interface', () => {
    it('should correctly identify strikes in score calculation', () => {
      const frames = [[10], [3, 4]];
      const result = service.calculateScore(frames);
      // First frame strike gets bonus from next two rolls (3+4=7)
      expect(result.frameScores[0]).toBe(17); // 10 + 3 + 4
      expect(result.frameScores[1]).toBe(24); // 17 + 7
    });

    it('should correctly identify spares in score calculation', () => {
      const frames = [[7, 3], [4, 2]];
      const result = service.calculateScore(frames);
      // First frame spare gets bonus from next roll (4)
      expect(result.frameScores[0]).toBe(14); // 10 + 4
      expect(result.frameScores[1]).toBe(20); // 14 + 6
    });

    it('should handle consecutive strikes correctly', () => {
      const frames = [[10], [10], [5, 3]];
      const result = service.calculateScore(frames);
      expect(result.frameScores[0]).toBe(25); // 10 + 10 + 5
      expect(result.frameScores[1]).toBe(43); // 25 + 10 + 5 + 3
      expect(result.frameScores[2]).toBe(51); // 43 + 8
    });

    it('should handle spare followed by strike', () => {
      const frames = [[7, 3], [10], [4, 2]];
      const result = service.calculateScore(frames);
      expect(result.frameScores[0]).toBe(20); // 10 + 10
      expect(result.frameScores[1]).toBe(36); // 20 + 10 + 4 + 2
      expect(result.frameScores[2]).toBe(42); // 36 + 6
    });
  });
});
