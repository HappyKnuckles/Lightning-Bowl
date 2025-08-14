import { ElementRef } from '@angular/core';
import { SearchBlurDirective } from './search-blur.directive';

describe('SearchBlurDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = new ElementRef(document.createElement('input'));
    const directive = new SearchBlurDirective(mockElementRef);
    expect(directive).toBeTruthy();
  });
});
