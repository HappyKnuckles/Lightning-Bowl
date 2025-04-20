import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2 } from '@angular/core';
import { timer, Subscription } from 'rxjs';

@Directive({
  selector: '[appLongPress]',
  standalone: true,
})
export class LongPressDirective implements OnDestroy {
  private timerSub?: Subscription;

  /** how long (ms) until `longPressed` fires */
  @Input() delay = 500;

  /** scale factor while pressing */
  @Input() scaleFactor = 1.05;

  /** CSS transition for the scale */
  @Input() transitionDuration = '150ms';

  @Output() longPressed = new EventEmitter<PointerEvent>();
  private scaleTimeout: any;
  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(ev: PointerEvent) {
    this.scaleTimeout = setTimeout(() => {
      this.renderer.setStyle(this.elementRef.nativeElement, 'transition', `transform ${this.transitionDuration} ease`);
      this.renderer.setStyle(this.elementRef.nativeElement, 'transform', `scale(${this.scaleFactor})`);
    }, 300);

    this.timerSub = timer(this.delay).subscribe(() => {
      this.longPressed.emit(ev);
    });
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('pointerleave')
  onPointerUp() {
    this.clearTimer();
    this.renderer.setStyle(this.elementRef.nativeElement, 'filter', 'none');
    this.renderer.removeStyle(this.elementRef.nativeElement, 'box-shadow');
    this.renderer.setStyle(this.elementRef.nativeElement, 'transform', 'translateY(0)');
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private clearTimer() {
    if (this.timerSub && !this.timerSub.closed) {
      this.timerSub.unsubscribe();
    }
    if (this.scaleTimeout) {
      clearTimeout(this.scaleTimeout);
      this.scaleTimeout = null;
    }
  }
}
