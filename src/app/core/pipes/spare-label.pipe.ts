import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spareLabel',
  standalone: true,
  pure: true,
})
export class SpareLabelPipe implements PipeTransform {
  transform(i: number): string {
    if (i === 0) return 'Overall';
    if (i === 1) return `${i} Pin`;
    return `${i} Pins`;
  }
}
