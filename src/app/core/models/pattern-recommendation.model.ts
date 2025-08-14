export interface PatternRecommendation {
  ballSelection: string;
  targetingStrategy: string;
  speedAdjustment: string;
  generalTips: string[];
}

export interface RecommendationCriteria {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  length: 'Short' | 'Medium' | 'Long';
  volume: 'Light' | 'Medium' | 'High' | 'Very High';
  ratio?: string;
  category: string;
}