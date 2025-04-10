import { Component, ElementRef, input, OnInit, ViewChild } from '@angular/core';
import { Pattern } from 'src/app/core/models/pattern.model';
import { IonCol, IonRow, IonGrid, IonLabel, IonChip } from '@ionic/angular/standalone';
import { ChartGenerationService } from 'src/app/core/services/chart/chart-generation.service';

@Component({
  selector: 'app-pattern-info',
  standalone: true,
  imports: [IonChip, IonLabel, IonGrid, IonRow, IonCol],
  templateUrl: './pattern-info.component.html',
  styleUrl: './pattern-info.component.scss',
})
export class PatternInfoComponent implements OnInit {
  @ViewChild('svg', { static: true }) svgElement!: ElementRef;
  pattern = input.required<Pattern>();
  yMax = 70; // Maximum y-axis value (distance in feet)
  xMax = 39; // Maximum x-axis value (board number)

  constructor(private chartService: ChartGenerationService) {}

  ngOnInit(): void {
    this.drawChart();
  }

  getDifficulty() {
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

  getLength() {
    const length = parseInt(this.pattern().distance, 10);
    if (length <= 35) {
      return 'Short';
    } else if (length < 41) {
      return 'Medium';
    } else {
      return 'Long';
    }
  }

  getVolume() {
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

  formatDistance(distance: string | number): string {
    if (!distance) return '0';

    const distStr = String(distance);
    if (distStr.endsWith("'")) {
      return distStr.slice(0, -1) + 'ft';
    }

    return distStr;
  }

  drawChart(){
    this.chartService.generatePatternChart(this.pattern(), this.svgElement);
  }
}
