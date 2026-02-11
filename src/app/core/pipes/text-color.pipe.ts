import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textColor',
  standalone: true,
  pure: true,
})
export class TextColorPipe implements PipeTransform {
  transform(backgroundColor: string): string {
    // Convert hex to RGB
    const r = parseInt(backgroundColor.substring(0, 2), 16);
    const g = parseInt(backgroundColor.substring(2, 4), 16);
    const b = parseInt(backgroundColor.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
