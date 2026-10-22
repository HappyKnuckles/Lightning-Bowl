import { Pipe, PipeTransform } from '@angular/core';
import { BallLayout } from 'src/app/core/models/ball.model';
import { BowlerFit } from 'src/app/core/models/fit.model';
import { formatBowlerFit, formatInches, formatLayout, LAYOUT_SYSTEM_LABELS } from 'src/app/core/utils/drill-utils/drill.utils';

/** 4.5 → '4 1/2"' */
@Pipe({ name: 'inches', standalone: true })
export class InchesPipe implements PipeTransform {
  transform(value: number | undefined): string {
    const formatted = formatInches(value);
    return formatted ? `${formatted}"` : '';
  }
}

/** Dual Angle → '45° × 4 1/2" × 30°'; with `withSystem` → 'Dual Angle 45° × 4 1/2" × 30°' */
@Pipe({ name: 'layout', standalone: true })
export class LayoutPipe implements PipeTransform {
  transform(layout: BallLayout | undefined, withSystem = false): string {
    const formatted = formatLayout(layout);
    if (!formatted || !layout || !withSystem) {
      return formatted;
    }
    return `${LAYOUT_SYSTEM_LABELS[layout.system]} ${formatted}`;
  }
}

/** 'Fingertip · Span 4 1/8" / 4 1/4" · PAP 5 1/4" over, 3/4" up' */
@Pipe({ name: 'bowlerFit', standalone: true })
export class BowlerFitPipe implements PipeTransform {
  transform(fit: BowlerFit | undefined): string {
    return formatBowlerFit(fit);
  }
}
