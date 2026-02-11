import { Pipe, PipeTransform } from '@angular/core';
import { Ball } from '../models/ball.model';

@Pipe({
  name: 'lengthPotential',
  standalone: true,
  pure: true,
})
export class LengthPotentialPipe implements PipeTransform {
  transform(ball: Ball): string {
    const rg = parseFloat(ball.core_rg);
    if (isNaN(rg)) {
      return '';
    }

    if (rg < 2.52) {
      return 'Early Roll';
    } else if (rg < 2.58) {
      return 'Medium Roll';
    } else {
      return 'Late Roll';
    }
  }
}
