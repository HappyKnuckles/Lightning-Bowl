import { ElementRef, Renderer2, NgZone } from '@angular/core';
import { LongPressDirective } from './long-press.directive';

describe('LongPressDirective', () => {
  it('should create an instance', () => {
    const mockElementRef = new ElementRef(document.createElement('div'));
    const mockRenderer = jasmine.createSpyObj('Renderer2', ['listen', 'setStyle', 'addClass', 'removeClass']);
    const mockNgZone = jasmine.createSpyObj('NgZone', ['runOutsideAngular', 'run']);
    const directive = new LongPressDirective(mockElementRef, mockRenderer, mockNgZone);
    expect(directive).toBeTruthy();
  });
});
