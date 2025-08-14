import { TestBed } from '@angular/core/testing';

import { PatternRecommendationService } from './pattern-recommendation.service';
import { RecommendationCriteria } from '../../models/pattern-recommendation.model';

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
    expect(recommendations.generalTips).toContain('Take advantage of the forgiving nature - you can be more aggressive with angles');
    expect(recommendations.speedAdjustment).toContain('increasing ball speed');
  });
});