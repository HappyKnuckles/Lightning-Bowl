import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { StatDefinition } from 'src/app/models/stat-definitions.model';
import { StatRowComponent } from '../stat-list/stat-row.component';

@Component({
  selector: 'app-stat-display',
  templateUrl: './stat-display.component.html',
  styleUrls: ['./stat-display.component.scss'],
  imports: [StatRowComponent, NgFor],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatDisplayComponent {
  @Input() statDefinitions: StatDefinition[] = [];
  @Input() currentStats!: any;
  @Input() prevStats?: any;
  constructor() {}

  trackByKey(index: number, stat: any): string {
    return stat.key;
  }
}
