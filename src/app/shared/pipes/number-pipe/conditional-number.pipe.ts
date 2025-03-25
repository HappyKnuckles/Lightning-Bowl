import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'conditionalNumber',
  standalone: true,
})
export class ConditionalNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value % 1 !== 0) {
      return value.toFixed(2);
    }
    return value.toString();
  }
}
