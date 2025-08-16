import { Component, Input } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Stats } from '../../../core/models/stats.model';

@Component({
  selector: 'app-pin-stats-display',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './pin-stats-display.component.html',
  styleUrl: './pin-stats-display.component.scss'
})
export class PinStatsDisplayComponent {
  @Input() title: string = '';
  @Input() stats!: Stats;

  get pinStats() {
    if (!this.stats || !this.stats.pinHitPercentages) {
      return [];
    }

    const pinStats = [];
    for (let pin = 1; pin <= 10; pin++) {
      pinStats.push({
        pin,
        hitPercentage: this.stats.pinHitPercentages[pin] || 0,
        hits: this.stats.pinHitCounts?.[pin] || 0,
        misses: this.stats.pinMissCounts?.[pin] || 0,
        total: (this.stats.pinHitCounts?.[pin] || 0) + (this.stats.pinMissCounts?.[pin] || 0)
      });
    }
    return pinStats;
  }

  get splitStats() {
    if (!this.stats) {
      return {
        totalSplits: 0,
        splitsConverted: 0,
        splitsMissed: 0,
        splitConversionPercentage: 0,
        splitTypes: {}
      };
    }

    return {
      totalSplits: this.stats.totalSplits || 0,
      splitsConverted: this.stats.splitsConverted || 0,
      splitsMissed: this.stats.splitsMissed || 0,
      splitConversionPercentage: this.stats.splitConversionPercentage || 0,
      splitTypes: this.stats.splitTypes || {}
    };
  }

  getSplitTypeEntries() {
    return Object.entries(this.splitStats.splitTypes);
  }
}
