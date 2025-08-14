import { TestBed } from '@angular/core/testing';

import { PatternRecommendationService } from './pattern-recommendation.service';
import { RecommendationCriteria } from '../../models/pattern-recommendation.model';
import { Ball } from '../../models/ball.model';

describe('PatternRecommendationService', () => {
  let service: PatternRecommendationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatternRecommendationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate recommendations for hard, short, light oil pattern', () => {
    const criteria: RecommendationCriteria = {
      difficulty: 'Hard',
      length: 'Short',
      volume: 'Light',
      ratio: '2.5:1',
      category: 'Sport'
    };

    const recommendations = service.generateRecommendations(criteria);

    expect(recommendations).toBeDefined();
    expect(recommendations.ballSelection).toContain('urethane');
    expect(recommendations.specificBallRecommendations).toBeDefined();
    expect(recommendations.specificBallRecommendations.length).toBeGreaterThan(0);
    expect(recommendations.arrowTargeting).toContain('1st-2nd arrow');
    expect(recommendations.breakpointStrategy).toContain('board 5-8');
    expect(recommendations.generalTips).toContain('Focus on consistency over power - precision is key on difficult patterns');
    expect(recommendations.speedAdjustment).toContain('Reduce ball speed');
  });

  it('should generate recommendations for easy, long, heavy oil pattern', () => {
    const criteria: RecommendationCriteria = {
      difficulty: 'Easy',
      length: 'Long',
      volume: 'Very High',
      ratio: '10:1',
      category: 'House'
    };

    const recommendations = service.generateRecommendations(criteria);

    expect(recommendations).toBeDefined();
    expect(recommendations.ballSelection).toContain('strong coverstock');
    expect(recommendations.specificBallRecommendations).toBeDefined();
    expect(recommendations.specificBallRecommendations.length).toBeGreaterThan(0);
    expect(recommendations.arrowTargeting).toContain('2nd arrow');
    expect(recommendations.breakpointStrategy).toContain('board 12-15');
    expect(recommendations.generalTips).toContain('Take advantage of the forgiving nature - you can be more aggressive with angles');
    expect(recommendations.speedAdjustment).toContain('increasing ball speed');
  });

  it('should recommend balls considering user arsenal', () => {
    const mockArsenal: Ball[] = [
      {
        ball_id: '1',
        ball_name: 'Storm Phaze II',
        brand_name: 'Storm',
        coverstock_type: 'Solid Reactive',
        core_name: 'R2S Pearl',
        release_date: '2018',
        brand_id: 'storm',
        ball_image: '',
        core_diff: '0.050',
        core_id: '1',
        core_image: '',
        core_int_diff: '0.020',
        core_rg: '2.48',
        core_type: 'Asymmetric',
        core_weight: '15',
        coverstock_id: '1',
        coverstock_name: 'R2S',
        factory_finish: '3000 Grit',
        last_update: '2024-01-01',
        thumbnail_image: '',
        us_int: 'Yes',
        availability: 'Available'
      }
    ];

    const criteria: RecommendationCriteria = {
      difficulty: 'Hard',
      length: 'Short',
      volume: 'Very High',
      ratio: '2.5:1',
      category: 'Sport',
      arsenal: mockArsenal
    };

    const recommendations = service.generateRecommendations(criteria);

    expect(recommendations).toBeDefined();
    expect(recommendations.specificBallRecommendations).toBeDefined();
    
    // Should find the Phaze II in recommendations and mention the user's arsenal ball
    const phaze2Recommendation = recommendations.specificBallRecommendations.find(rec => 
      rec.includes('Storm Phaze II') && rec.includes('✅')
    );
    expect(phaze2Recommendation).toBeTruthy();
    expect(phaze2Recommendation).toContain('Consider your Storm Phaze II');
  });

  it('should work without arsenal data', () => {
    const criteria: RecommendationCriteria = {
      difficulty: 'Hard',
      length: 'Short',
      volume: 'Light',
      ratio: '2.5:1',
      category: 'Sport'
    };

    const recommendations = service.generateRecommendations(criteria);

    expect(recommendations).toBeDefined();
    expect(recommendations.specificBallRecommendations).toBeDefined();
    expect(recommendations.specificBallRecommendations.length).toBeGreaterThan(0);
    
    // Should not contain arsenal match indicators when no arsenal is provided
    const hasArsenalMatches = recommendations.specificBallRecommendations.some(rec => rec.includes('✅'));
    expect(hasArsenalMatches).toBeFalsy();
  });
});