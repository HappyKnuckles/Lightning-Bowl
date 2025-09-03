import { DatePipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { IonChip } from '@ionic/angular/standalone';
import { GameFilter } from 'src/app/core/models/filter.model';
import { GameFilterService } from 'src/app/core/services/game-filter/game-filter.service';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { BaseFilterActiveComponent } from '../base-filter-active/base-filter-active.component';

@Component({
  selector: 'app-game-filter-active',
  standalone: true,
  imports: [IonChip, NgIf, DatePipe],
  templateUrl: './game-filter-active.component.html',
  styleUrl: './game-filter-active.component.scss',
})
export class GameFilterActiveComponent extends BaseFilterActiveComponent<GameFilter> {
  constructor(
    private gameFilterService: GameFilterService,
    protected override utilsService: UtilsService,
  ) {
    super(gameFilterService, utilsService);
  }
}
