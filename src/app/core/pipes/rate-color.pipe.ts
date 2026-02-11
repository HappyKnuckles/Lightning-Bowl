import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rateColor',
  standalone: true,
  pure: true,
})
export class RateColorPipe implements PipeTransform {
  transform(conversionRate: number): string {
    if (conversionRate > 95) {
      return '#4faeff';
    } else if (conversionRate > 75) {
      return '#008000';
    } else if (conversionRate > 50) {
      return '#809300';
    } else if (conversionRate > 33) {
      return '#FFA500';
    } else {
      return '#FF0000';
    }
  }
}
