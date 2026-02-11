import { Pipe, PipeTransform } from '@angular/core';
import { Ball } from '../models/ball.model';

@Pipe({
  name: 'flarePotential',
  standalone: true,
  pure: true,
})
export class FlarePotentialPipe implements PipeTransform {
  transform(ball: Ball): string {
    const diff = parseFloat(ball.core_diff);
    if (isNaN(diff)) {
      return '';
    }

    if (diff < 0.035) {
      return 'Low Flare';
    } else if (diff < 0.05) {
      return 'Medium Flare';
    } else {
      return 'High Flare';
    }
  }
}
