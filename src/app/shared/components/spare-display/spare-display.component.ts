import { CommonModule, NgIf, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { IonText, IonCol, IonRow, IonIcon, IonGrid } from '@ionic/angular/standalone';
import { PrevStats, SessionStats, Stats } from 'src/app/core/models/stats.model';
import { addIcons } from 'ionicons';
import { arrowDown, arrowUp, informationCircleOutline } from 'ionicons/icons';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { SpareLabelPipe } from 'src/app/core/pipes/spare-label.pipe';
import { RateColorPipe } from 'src/app/core/pipes/rate-color.pipe';

@Component({
  selector: 'app-spare-display',
  templateUrl: './spare-display.component.html',
  styleUrls: ['./spare-display.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonText, IonCol, IonRow, IonIcon, IonGrid, NgIf, NgStyle, CommonModule, SpareLabelPipe, RateColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpareDisplayComponent {
  @Input({ required: true }) stats!: Stats | SessionStats;
  @Input() title = '';
  @Input() prevStats?: PrevStats | Stats;
  @Input() id?: string;
  constructor(private utilsService: UtilsService) {
    addIcons({ informationCircleOutline, arrowUp, arrowDown });
  }

  calculateStatDifference(currentValue: number, previousValue: number): string {
    return this.utilsService.calculateStatDifference(currentValue, previousValue);
  }

  getArrowIcon(currentValue: number, previousValue: number): string {
    return this.utilsService.getArrowIcon(currentValue, previousValue);
  }

  getDiffColor(currentValue: number, previousValue: number): string {
    return this.utilsService.getDiffColor(currentValue, previousValue);
  }
}
