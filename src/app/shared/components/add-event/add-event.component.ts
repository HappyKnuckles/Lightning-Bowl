import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonDatetimeButton,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { CalendarService } from '../../../core/services/calendar/calendar.service';
import { CalendarEvent } from '../../../core/models/calendar-event.model';
import { addIcons } from 'ionicons';
import { checkmark, close } from 'ionicons/icons';

@Component({
  selector: 'app-add-event',
  standalone: true,
  imports: [
    IonDatetimeButton,
    IonModal,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonButton,
    IonButtons,
    IonIcon,
    IonCheckbox,
  ],
  templateUrl: './add-event.component.html',
  styleUrl: './add-event.component.css',
})
export class AddEventComponent {
  private modalController = inject(ModalController);
  private calendarService = inject(CalendarService);
  private fb = inject(FormBuilder);

  eventForm: FormGroup;
  selectedDate = '';
  isAllDay = false;

  constructor() {
    addIcons({ checkmark, close });

    // Initialize with today's date if no date is provided
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;

    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['other', Validators.required],
      starts: [new Date().toISOString(), Validators.required],
      ends: [new Date().toISOString(), Validators.required],
      location: [''],
      description: [''],
      isAllDay: [false],
    });

    // Subscribe to isAllDay changes to keep component property in sync
    this.eventForm.get('isAllDay')?.valueChanges.subscribe((value) => {
      this.isAllDay = value;
    });
  }

  setInitialDate(date: string) {
    this.selectedDate = date;
    const startDateTime = new Date(date).toISOString();
    const endDateTime = new Date(date);
    endDateTime.setHours(endDateTime.getHours() + 1); // Default to 1 hour duration

    this.eventForm.patchValue({
      starts: startDateTime,
      ends: endDateTime.toISOString(),
    });
  }

  async onSave() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;

      // Extract date and time from combined datetime fields
      const startDateTime = new Date(formValue.starts);
      const endDateTime = new Date(formValue.ends);

      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formValue.name,
        startDate: startDateTime.toISOString().split('T')[0], // Extract date part
        endDate: endDateTime.toISOString().split('T')[0],
        // For all-day events, set time to 00:00, otherwise extract actual time
        startTime: formValue.isAllDay ? '00:00' : startDateTime.toTimeString().substring(0, 5),
        endTime: formValue.isAllDay ? '00:00' : endDateTime.toTimeString().substring(0, 5),
        location: formValue.location || undefined,
        description: formValue.description || undefined,
        type: formValue.type,
        color: this.calendarService.getEventTypeColor(formValue.type),
      };

      const newEvent = this.calendarService.addEvent(eventData);
      await this.modalController.dismiss(newEvent);
    }
  }

  async onCancel() {
    await this.modalController.dismiss(null);
  }

  get isFormValid() {
    return this.eventForm.valid;
  }

  onStartsChange(event: CustomEvent) {
    const newStartValue = event.detail.value;
    this.eventForm.patchValue({
      starts: newStartValue,
    });

    // If start date is after end date, set end date to same day as start
    const startDate = new Date(newStartValue);
    const endDate = new Date(this.eventForm.get('ends')?.value);

    if (startDate.toDateString() !== endDate.toDateString() && startDate > endDate) {
      // Set end date to same day as start date
      const newEndDate = new Date(startDate);
      if (this.isAllDay) {
        // For all-day events, keep it at 00:00
        newEndDate.setHours(0, 0, 0, 0);
      } else {
        // For timed events, set it to 1 hour later, or if that would be next day, set to 23:59
        newEndDate.setHours(startDate.getHours() + 1, startDate.getMinutes(), 0, 0);
        if (newEndDate.toDateString() !== startDate.toDateString()) {
          newEndDate.setHours(23, 59, 0, 0);
        }
      }
      this.eventForm.patchValue({
        ends: newEndDate.toISOString(),
      });
    }
  }

  onEndsChange(event: CustomEvent) {
    const newEndValue = event.detail.value;
    this.eventForm.patchValue({
      ends: newEndValue,
    });

    // If end date is before start date, set start date to same day as end
    const startDate = new Date(this.eventForm.get('starts')?.value);
    const endDate = new Date(newEndValue);

    if (endDate.toDateString() !== startDate.toDateString() && endDate < startDate) {
      // Set start date to same day as end date
      const newStartDate = new Date(endDate);
      if (this.isAllDay) {
        // For all-day events, keep it at 00:00
        newStartDate.setHours(0, 0, 0, 0);
      } else {
        // For timed events, set it to 1 hour earlier, or if that would be previous day, set to 00:00
        newStartDate.setHours(endDate.getHours() - 1, endDate.getMinutes(), 0, 0);
        if (newStartDate.toDateString() !== endDate.toDateString()) {
          newStartDate.setHours(0, 0, 0, 0);
        }
      }
      this.eventForm.patchValue({
        starts: newStartDate.toISOString(),
      });
    }
  }

  onAllDayChange(event: CustomEvent) {
    this.isAllDay = event.detail.checked;
    this.eventForm.patchValue({
      isAllDay: this.isAllDay,
    });

    if (this.isAllDay) {
      // When all-day is enabled, set times to 00:00
      const startDate = new Date(this.eventForm.get('starts')?.value);
      const endDate = new Date(this.eventForm.get('ends')?.value);

      // Set to start of day (00:00)
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      this.eventForm.patchValue({
        starts: startDate.toISOString(),
        ends: endDate.toISOString(),
      });
    }
  }
}
