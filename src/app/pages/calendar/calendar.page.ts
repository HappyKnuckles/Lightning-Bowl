import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController, GestureController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { CalendarService } from '../../core/services/calendar/calendar.service';
import { CalendarEvent, CalendarDay, CalendarWeek, CalendarViewMode } from '../../core/models/calendar-event.model';
import { AddEventComponent } from '../../shared/components/add-event/add-event.component';
import { addIcons } from 'ionicons';
import { add, chevronBack, chevronForward, swapHorizontal } from 'ionicons/icons';
import { Gesture, GestureDetail } from '@ionic/angular';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonFab,
    IonFabButton,
  ],
  providers: [ModalController],
})
export class CalendarPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('calendarContainer', { read: ElementRef }) calendarContainerRef!: ElementRef;
  @ViewChild('currentSlide', { read: ElementRef }) currentSlideRef!: ElementRef;
  @ViewChild('previousSlide', { read: ElementRef }) previousSlideRef!: ElementRef;
  @ViewChild('nextSlide', { read: ElementRef }) nextSlideRef!: ElementRef;
  @ViewChild(IonContent) contentRef!: IonContent;

  private modalController = inject(ModalController);
  private calendarService = inject(CalendarService);
  private gestureController = inject(GestureController);
  private eventsSubscription?: Subscription;
  private monthSwipeGesture?: Gesture;
  private weekSwipeGesture?: Gesture;

  viewMode: CalendarViewMode = 'month';
  currentDate = new Date();
  selectedDate: Date | null = null;
  events: CalendarEvent[] = [];
  showSwipeInstruction = true;

  // Calendar display data
  monthWeeks: CalendarWeek[] = [];
  weekDays: CalendarDay[] = [];

  // Preview data for swipe animation
  previousMonthWeeks: CalendarWeek[] = [];
  previousWeekDays: CalendarDay[] = [];
  nextMonthWeeks: CalendarWeek[] = [];
  nextWeekDays: CalendarDay[] = [];

  // Animation state
  isAnimating = false;
  swipeProgress = 0;

  // Display helpers
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor() {
    addIcons({ chevronBack, chevronForward, swapHorizontal, add });
  }

  ngOnInit() {
    this.eventsSubscription = this.calendarService.events$.subscribe((events) => {
      this.events = events;
      this.updateCalendarDisplay();
    });
    this.updateCalendarDisplay();
  }

  ngAfterViewInit() {
    // Initialize swipe gestures after view is ready
    setTimeout(() => {
      this.setupSwipeGestures();
      this.resetSlidePositions();
    }, 100);
  }

  ngOnDestroy() {
    this.eventsSubscription?.unsubscribe();
    this.cleanupGestures();
  }

  get currentMonthYear(): string {
    return `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  get currentWeekRange(): string {
    if (this.viewMode !== 'week' || this.weekDays.length === 0) return '';

    const firstDay = this.weekDays[0].date;
    const lastDay = this.weekDays[6].date;

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${this.monthNames[firstDay.getMonth()]} ${firstDay.getDate()}-${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    } else {
      return `${this.monthNames[firstDay.getMonth()]} ${firstDay.getDate()} - ${this.monthNames[lastDay.getMonth()]} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
    }
  }

  onViewModeChange(event: CustomEvent) {
    this.viewMode = event.detail.value;
    this.updateCalendarDisplay();
  }
  previousPeriod() {
    // Hide instruction when using button navigation
    this.showSwipeInstruction = false;

    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    this.updateCalendarDisplay();
  }

  nextPeriod() {
    // Hide instruction when using button navigation
    this.showSwipeInstruction = false;

    if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else {
      this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    this.updateCalendarDisplay();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.updateCalendarDisplay();
  }

  selectDay(day: CalendarDay) {
    this.selectedDate = new Date(day.date);
    this.updateCalendarDisplay();
  }

  async addEvent() {
    const modal = await this.modalController.create({
      component: AddEventComponent,
      presentingElement: await this.modalController.getTop(),
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      // Event was created, calendar will automatically update via subscription
    }
  }
  private updateCalendarDisplay() {
    if (this.viewMode === 'month') {
      this.generateMonthView();
      this.generatePreviousMonthView();
      this.generateNextMonthView();
    } else {
      this.generateWeekView();
      this.generatePreviousWeekView();
      this.generateNextWeekView();
    }

    // Reinitialize swipe gestures after view update
    setTimeout(() => {
      this.setupSwipeGestures();
    }, 100);
  }

  private generateMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    this.monthWeeks = [];
    const currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const week: CalendarWeek = { days: [] };

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);

        const day: CalendarDay = {
          date: new Date(date),
          isCurrentMonth: date.getMonth() === month,
          isToday: this.isToday(date),
          isSelected: this.isSelected(date),
          events: this.getEventsForDate(date),
        };

        week.days.push(day);
      }

      this.monthWeeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
  }

  private generateWeekView() {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    this.weekDays = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const day: CalendarDay = {
        date: new Date(date),
        isCurrentMonth: true, // In week view, all days are considered "current"
        isToday: this.isToday(date),
        isSelected: this.isSelected(date),
        events: this.getEventsForDate(date),
      };

      this.weekDays.push(day);
    }
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isSelected(date: Date): boolean {
    if (!this.selectedDate) return false;
    return date.toDateString() === this.selectedDate.toDateString();
  }

  private getEventsForDate(date: Date): CalendarEvent[] {
    const dateString = this.formatDateForInput(date);
    return this.events.filter((event) => event.date === dateString);
  }

  // Public method for template access
  getEventsForSelectedDate(): CalendarEvent[] {
    if (!this.selectedDate) return [];
    return this.getEventsForDate(this.selectedDate);
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getEventTypeColor(type: CalendarEvent['type']): string {
    return this.calendarService.getEventTypeColor(type);
  }
  private setupSwipeGestures() {
    this.cleanupGestures(); // Clean up any existing gestures

    // Setup swipe gesture for the calendar container
    if (this.calendarContainerRef) {
      const containerElement = this.calendarContainerRef.nativeElement;

      const swipeGesture = this.gestureController.create(
        {
          el: containerElement,
          threshold: 15,
          gestureName: 'calendar-swipe',
          onMove: (detail) => this.onSwipeMove(detail),
          onEnd: (detail) => this.onSwipeEnd(detail),
        },
        true,
      );

      swipeGesture.enable();

      // Store the gesture based on current view mode
      if (this.viewMode === 'month') {
        this.monthSwipeGesture = swipeGesture;
      } else {
        this.weekSwipeGesture = swipeGesture;
      }
    }
  }
  private onSwipeMove(detail: GestureDetail): void {
    if (this.isAnimating) return;

    const progress = Math.abs(detail.deltaX) / 300; // Normalize progress
    const clampedProgress = Math.min(progress, 1);
    this.swipeProgress = clampedProgress;

    // Apply transform to show preview
    if (this.calendarContainerRef) {
      const container = this.calendarContainerRef.nativeElement;
      const translateX = detail.deltaX;

      // Add swiping class for visual feedback
      container.classList.add('swiping');

      // Apply smooth transform during swipe
      container.style.transform = `translateX(${translateX}px)`;
      container.style.transition = 'none';

      // Show/hide preview slides based on swipe direction
      if (detail.deltaX > 0) {
        // Swiping right - show previous
        this.showPreviousSlide();
      } else if (detail.deltaX < 0) {
        // Swiping left - show next
        this.showNextSlide();
      }
    }
  }

  private onSwipeEnd(detail: GestureDetail) {
    const threshold = 80; // Minimum distance for a swipe
    const velocityThreshold = 0.4; // Minimum velocity for a swipe

    // Reset animation state
    this.isAnimating = true;
    this.swipeProgress = 0;

    if (this.calendarContainerRef) {
      // Check if it's a horizontal swipe with enough distance or velocity
      if (Math.abs(detail.deltaX) > threshold || Math.abs(detail.velocityX) > velocityThreshold) {
        // Hide instruction after first successful swipe
        this.showSwipeInstruction = false;

        if (detail.deltaX > 0 || detail.velocityX > 0) {
          // Swipe right - go to previous period with animation
          this.animateToSlide('previous', () => {
            this.previousPeriod();
            this.resetSlidePositions();
          });
        } else {
          // Swipe left - go to next period with animation
          this.animateToSlide('next', () => {
            this.nextPeriod();
            this.resetSlidePositions();
          });
        }
      } else {
        // Snap back to current position
        this.animateToSlide('current', () => {
          this.resetSlidePositions();
        });
      }
    }
  }

  private showPreviousSlide() {
    if (this.previousSlideRef) {
      this.previousSlideRef.nativeElement.style.display = 'block';
      this.previousSlideRef.nativeElement.style.transform = 'translateX(-100%)';
    }
  }

  private showNextSlide() {
    if (this.nextSlideRef) {
      this.nextSlideRef.nativeElement.style.display = 'block';
      this.nextSlideRef.nativeElement.style.transform = 'translateX(100%)';
    }
  }

  private animateToSlide(direction: 'previous' | 'current' | 'next', callback: () => void) {
    if (!this.calendarContainerRef) return;

    const container = this.calendarContainerRef.nativeElement;
    let targetTransform = '';

    switch (direction) {
      case 'previous':
        targetTransform = 'translateX(100%)';
        break;
      case 'next':
        targetTransform = 'translateX(-100%)';
        break;
      case 'current':
      default:
        targetTransform = 'translateX(0)';
        break;
    }

    // Apply smooth transition
    container.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    container.style.transform = targetTransform;

    // Execute callback after animation
    setTimeout(() => {
      callback();
      this.isAnimating = false;
    }, 300);
  }

  private resetSlidePositions() {
    if (this.calendarContainerRef) {
      const container = this.calendarContainerRef.nativeElement;
      container.style.transform = 'translateX(0)';
      container.style.transition = 'none';
      container.classList.remove('swiping');
    }

    // Hide preview slides
    if (this.previousSlideRef) {
      this.previousSlideRef.nativeElement.style.display = 'none';
    }
    if (this.nextSlideRef) {
      this.nextSlideRef.nativeElement.style.display = 'none';
    }
  }

  private cleanupGestures() {
    if (this.monthSwipeGesture) {
      this.monthSwipeGesture.destroy();
      this.monthSwipeGesture = undefined;
    }
    if (this.weekSwipeGesture) {
      this.weekSwipeGesture.destroy();
      this.weekSwipeGesture = undefined;
    }
  }

  private generatePreviousMonthView() {
    const previousDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.previousMonthWeeks = this.generateMonthViewForDate(previousDate);
  }

  private generateNextMonthView() {
    const nextDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.nextMonthWeeks = this.generateMonthViewForDate(nextDate);
  }

  private generatePreviousWeekView() {
    const previousDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.previousWeekDays = this.generateWeekViewForDate(previousDate);
  }

  private generateNextWeekView() {
    const nextDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.nextWeekDays = this.generateWeekViewForDate(nextDate);
  }

  private generateMonthViewForDate(targetDate: Date): CalendarWeek[] {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const weeks: CalendarWeek[] = [];
    const currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const week: CalendarWeek = { days: [] };

      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);

        const day: CalendarDay = {
          date: new Date(date),
          isCurrentMonth: date.getMonth() === month,
          isToday: this.isToday(date),
          isSelected: false, // Preview slides don't show selection
          events: this.getEventsForDate(date),
        };

        week.days.push(day);
      }

      weeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  }

  private generateWeekViewForDate(targetDate: Date): CalendarDay[] {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weekDays: CalendarDay[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);

      const day: CalendarDay = {
        date: new Date(date),
        isCurrentMonth: true,
        isToday: this.isToday(date),
        isSelected: false, // Preview slides don't show selection
        events: this.getEventsForDate(date),
      };

      weekDays.push(day);
    }

    return weekDays;
  }
}
