import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { IonText, IonIcon } from '@ionic/angular/standalone';
import { ConditionalNumberPipe } from '../../pipes/number-pipe/conditional-number.pipe';
import { addIcons } from 'ionicons';
import { arrowDown, arrowUp, informationCircleOutline } from 'ionicons/icons';
import { UtilsService } from 'src/app/core/services/utils/utils.service';

@Component({
  selector: 'app-stat-row',
  templateUrl: './stat-row.component.html',
  styleUrls: ['./stat-row.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgIf, IonText, IonIcon, ConditionalNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatRowComponent {
  label = input.required<string>();
  currentStat = input.required<number>();
  toolTip = input<string | undefined>();
  prevStat = input<number | undefined>();
  id = input<string | undefined>();
  isPercentage = input<boolean | undefined>();

  statDifference = computed(() => {
    return this.calculateStatDifference(this.currentStat(), this.prevStat()!);
  });

  constructor(private utilsService: UtilsService) {
    addIcons({ informationCircleOutline, arrowUp, arrowDown });
  }

  getArrowIcon(currentValue: number, previousValue?: number): string {
    return this.utilsService.getArrowIcon(currentValue, previousValue);
  }

  getDiffColor(currentValue: number, previousValue?: number): string {
    return this.utilsService.getDiffColor(currentValue, previousValue);
  }

  private calculateStatDifference(currentValue: number, previousValue: number): string {
    return this.utilsService.calculateStatDifference(currentValue, previousValue);
  }
}
