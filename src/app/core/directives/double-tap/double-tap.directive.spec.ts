import { DoubleTapDirective } from './double-tap.directive';
import { ElementRef, Renderer2 } from '@angular/core';
import { HapticService } from '../../services/haptic/haptic.service';

describe('DoubleTapDirective', () => {
  let directive: DoubleTapDirective;
  let mockElementRef: ElementRef;
  let mockRenderer: Renderer2;
  let mockHapticService: HapticService;

  beforeEach(() => {
    mockElementRef = {
      nativeElement: document.createElement('div'),
    } as ElementRef;

    mockRenderer = jasmine.createSpyObj('Renderer2', [
      'createElement',
      'setAttribute',
      'setStyle',
      'appendChild',
      'removeChild',
    ]);

    mockHapticService = jasmine.createSpyObj('HapticService', ['vibrate']);

    directive = new DoubleTapDirective(mockElementRef, mockRenderer, mockHapticService);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });

  it('should have default doubleTapDelay of 300ms', () => {
    expect(directive.doubleTapDelay).toBe(300);
  });

  it('should have default scaleFactor of 1.2', () => {
    expect(directive.scaleFactor).toBe(1.2);
  });
});
