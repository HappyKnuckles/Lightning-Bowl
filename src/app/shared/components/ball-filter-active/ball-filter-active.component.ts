import { Component } from '@angular/core';
import { BallFilter } from 'src/app/core/models/filter.model';
import { BallFilterService } from 'src/app/core/services/ball-filter/ball-filter.service';
import { IonChip } from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { BaseFilterActiveComponent } from '../base-filter-active/base-filter-active.component';

@Component({
  selector: 'app-ball-filter-active',
  standalone: true,
  imports: [IonChip, NgIf],
  templateUrl: './ball-filter-active.component.html',
  styleUrl: './ball-filter-active.component.scss',
})
export class BallFilterActiveComponent extends BaseFilterActiveComponent<BallFilter> {
  constructor(private ballFilterService: BallFilterService) {
    super(ballFilterService);
  }

  override isFilterActive(key: keyof BallFilter): boolean {
    if (key === 'weight') {
      return true;
    }
    return super.isFilterActive(key);
  }
}
