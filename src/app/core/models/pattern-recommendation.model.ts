export interface PatternRecommendation {
  ballSelection: string;
  specificBallRecommendations: string[];
  targetingStrategy: string;
  arrowTargeting: string;
  breakpointStrategy: string;
  speedAdjustment: string;
  generalTips: string[];
}

import { Ball } from './ball.model';

export interface RecommendationCriteria {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  length: 'Short' | 'Medium' | 'Long';
  volume: 'Light' | 'Medium' | 'High' | 'Very High';
  ratio?: string;
  category: string;
  arsenal?: Ball[];
}