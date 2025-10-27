import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2 } from '@angular/core';
import { HapticService } from '../../services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';

@Directive({
  selector: '[appDoubleTap]',
  standalone: true,
})
export class DoubleTapDirective implements OnDestroy {
  private lastTapTime = 0;
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private singleTapTimeout: ReturnType<typeof setTimeout> | null = null;
  private preventClick = false;

  /** Maximum delay (ms) between taps to register as double tap (Instagram uses ~300ms) */
  @Input() doubleTapDelay = 300;

  /** Scale factor for animation */
  @Input() scaleFactor = 1.2;

  /** Animation duration */
  @Input() animationDuration = '300ms';

  @Output() doubleTapped = new EventEmitter<PointerEvent>();

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private hapticService: HapticService,
  ) {}

  @HostListener('click', ['$event'])
  onClick(ev: Event) {
    // Prevent click event if double tap was detected
    if (this.preventClick) {
      ev.preventDefault();
      ev.stopPropagation();
      this.preventClick = false;
    }
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(ev: PointerEvent) {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.lastTapTime;

    if (timeSinceLastTap > 0 && timeSinceLastTap < this.doubleTapDelay) {
      // Double tap detected
      ev.preventDefault();
      ev.stopPropagation();
      
      // Clear any pending single tap
      if (this.singleTapTimeout) {
        clearTimeout(this.singleTapTimeout);
        this.singleTapTimeout = null;
      }
      
      // Prevent the click event that follows
      this.preventClick = true;
      
      this.hapticService.vibrate(ImpactStyle.Medium);
      this.showHeartAnimation();
      this.doubleTapped.emit(ev);
      
      // Reset to prevent triple tap
      this.lastTapTime = 0;
    } else {
      // Single tap - store time
      this.lastTapTime = currentTime;
    }
  }

  private showHeartAnimation() {
    // Create heart icon overlay
    const heart = this.renderer.createElement('ion-icon');
    this.renderer.setAttribute(heart, 'name', 'heart');
    this.renderer.setStyle(heart, 'position', 'absolute');
    this.renderer.setStyle(heart, 'top', '50%');
    this.renderer.setStyle(heart, 'left', '50%');
    this.renderer.setStyle(heart, 'transform', 'translate(-50%, -50%) scale(0)');
    this.renderer.setStyle(heart, 'font-size', '80px');
    this.renderer.setStyle(heart, 'color', 'var(--ion-color-primary)');
    this.renderer.setStyle(heart, 'pointer-events', 'none');
    this.renderer.setStyle(heart, 'z-index', '1000');
    this.renderer.setStyle(heart, 'transition', `transform ${this.animationDuration} ease-out, opacity ${this.animationDuration} ease-out`);
    this.renderer.setStyle(heart, 'opacity', '0');

    // Ensure parent has relative positioning
    const currentPosition = this.elementRef.nativeElement.style.position;
    if (!currentPosition || currentPosition === 'static') {
      this.renderer.setStyle(this.elementRef.nativeElement, 'position', 'relative');
    }

    this.renderer.appendChild(this.elementRef.nativeElement, heart);

    // Trigger animation
    requestAnimationFrame(() => {
      this.renderer.setStyle(heart, 'transform', `translate(-50%, -50%) scale(${this.scaleFactor})`);
      this.renderer.setStyle(heart, 'opacity', '1');
    });

    // Fade out and remove
    this.animationTimeout = setTimeout(() => {
      this.renderer.setStyle(heart, 'opacity', '0');
      this.renderer.setStyle(heart, 'transform', `translate(-50%, -50%) scale(${this.scaleFactor * 1.2})`);
      
      setTimeout(() => {
        this.renderer.removeChild(this.elementRef.nativeElement, heart);
      }, 300);
    }, 300);
  }

  ngOnDestroy() {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    if (this.singleTapTimeout) {
      clearTimeout(this.singleTapTimeout);
      this.singleTapTimeout = null;
    }
  }
}
