import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatDefinition } from 'src/app/core/models/stat-definitions.model';
import { StatRowComponent } from '../stat-row/stat-row.component';
import { GameStats } from 'src/app/core/models/stats.model';
@Component({
  selector: 'app-stat-display',
  templateUrl: './stat-display.component.html',
  styleUrls: ['./stat-display.component.scss'],
  imports: [StatRowComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatDisplayComponent {
  @Input() statDefinitions: StatDefinition[] = [];
  @Input() currentStats!: GameStats;
  @Input() prevStats?: GameStats;

  getNumericStat(stats: GameStats | undefined, key: string): number | undefined {
    if (!stats) return undefined;
    const value = stats[key];
    return typeof value === 'number' ? value : undefined;
  }
}
