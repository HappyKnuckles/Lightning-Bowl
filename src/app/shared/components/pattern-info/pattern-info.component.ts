import { Component, input, computed } from '@angular/core';
import { Pattern } from '../../../core/models/pattern.model';
import { RecommendationCriteria } from '../../../core/models/pattern-recommendation.model';
import { PatternRecommendationService } from '../../../core/services/pattern-recommendation/pattern-recommendation.service';
import { IonCol, IonRow, IonGrid, IonLabel, IonChip, IonText, IonItem, IonIcon, IonList, IonListHeader } from '@ionic/angular/standalone';

@Component({
  selector: 'app-pattern-info',
  standalone: true,
  imports: [IonListHeader, IonList, IonIcon, IonItem, IonText, IonChip, IonLabel, IonGrid, IonRow, IonCol],
  templateUrl: './pattern-info.component.html',
  styleUrl: './pattern-info.component.scss',
})
export class PatternInfoComponent {
  pattern = input.required<Pattern>();

  constructor(private recommendationService: PatternRecommendationService) {}

  recommendations = computed(() => {
    const criteria: RecommendationCriteria = {
      difficulty: this.getDifficulty(),
      length: this.getLength(),
      volume: this.getVolume(),
      ratio: this.pattern().ratio,
      category: this.pattern().category,
    };
    return this.recommendationService.generateRecommendations(criteria);
  });

  getDifficulty(): 'Easy' | 'Medium' | 'Hard' {
    const numericPart = this.pattern().ratio?.split(':')[0] || '0';
    const num = parseInt(numericPart, 10);
    if (num <= 4) {
      return 'Hard';
    } else if (num <= 8) {
      return 'Medium';
    } else {
      return 'Easy';
    }
  }

  getLength(): 'Short' | 'Medium' | 'Long' {
    const length = parseInt(this.pattern().distance, 10);
    if (length <= 35) {
      return 'Short';
    } else if (length < 41) {
      return 'Medium';
    } else {
      return 'Long';
    }
  }

  getVolume(): 'Light' | 'Medium' | 'High' | 'Very High' {
    const volume = parseInt(this.pattern().volume, 10);
    if (volume < 22) {
      return 'Light';
    } else if (volume <= 26) {
      return 'Medium';
    } else if (volume < 30) {
      return 'High';
    } else {
      return 'Very High';
    }
  }
}
