import { TestBed } from '@angular/core/testing';
import { AlertController } from '@ionic/angular';
import { HighScoreAlertService } from './high-score-alert.service';
import { StorageService } from '../storage/storage.service';
import { Game } from '../../models/game.model';

describe('HighScoreAlertService', () => {
  let service: HighScoreAlertService;
  let mockStorageService: jasmine.SpyObj<StorageService>;
  let mockAlertController: jasmine.SpyObj<AlertController>;

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['allPatterns']);
    const alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      providers: [
        HighScoreAlertService,
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: AlertController, useValue: alertControllerSpy }
      ]
    });

    service = TestBed.inject(HighScoreAlertService);
    mockStorageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    mockAlertController = TestBed.inject(AlertController) as jasmine.SpyObj<AlertController>;

    // Mock patterns data
    mockStorageService.allPatterns.and.returnValue([
      { url: 'pattern-1-url', title: 'House Pattern', category: 'Standard' },
      { url: 'pattern-2-url', title: 'Sport Pattern', category: 'Challenge' }
    ]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should display pattern titles instead of URLs in game details', () => {
    const testGame: Game = {
      gameId: 'test-game-1',
      date: Date.parse('2024-01-15'),
      totalScore: 180,
      league: 'Test League',
      patterns: ['pattern-1-url', 'pattern-2-url'],
      balls: ['Ball 1'],
      frames: [],
      frameScores: [],
      isSeries: false,
      isClean: false,
      isPerfect: false,
      isPractice: false
    };

    // Access the private method using bracket notation for testing
    const gameDetails = (service as any).getGameDetails(testGame);

    expect(gameDetails).toContain('Patterns: House Pattern, Sport Pattern');
    expect(gameDetails).not.toContain('pattern-1-url');
    expect(gameDetails).not.toContain('pattern-2-url');
  });

  it('should handle unknown pattern URLs gracefully', () => {
    const testGame: Game = {
      gameId: 'test-game-2',
      date: Date.parse('2024-01-15'),
      totalScore: 180,
      league: 'Test League',
      patterns: ['unknown-pattern-url'],
      balls: ['Ball 1'],
      frames: [],
      frameScores: [],
      isSeries: false,
      isClean: false,
      isPerfect: false,
      isPractice: false
    };

    const gameDetails = (service as any).getGameDetails(testGame);

    expect(gameDetails).toContain('Patterns: unknown-pattern-url');
  });

  it('should not include patterns section when no patterns are provided', () => {
    const testGame: Game = {
      gameId: 'test-game-3',
      date: Date.parse('2024-01-15'),
      totalScore: 180,
      league: 'Test League',
      patterns: [],
      balls: ['Ball 1'],
      frames: [],
      frameScores: [],
      isSeries: false,
      isClean: false,
      isPerfect: false,
      isPractice: false
    };

    const gameDetails = (service as any).getGameDetails(testGame);

    expect(gameDetails).not.toContain('Patterns:');
  });
});