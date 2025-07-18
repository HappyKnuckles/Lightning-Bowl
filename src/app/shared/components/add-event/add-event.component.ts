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
} from '@ionic/angular/standalone';
import { CalendarService } from '../../../core/services/calendar/calendar.service';
import { CalendarEvent } from '../../../core/models/calendar-event.model';
import { addIcons } from 'ionicons';
import { checkmark, close } from 'ionicons/icons';

@Component({
  selector: 'app-add-event',
  standalone: true,
  imports: [
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

  constructor() {
    addIcons({ checkmark, close });

    // Initialize with today's date if no date is provided
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate = today;

    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      date: [today, Validators.required],
      time: [''],
      location: [''],
      description: [''],
      type: ['other', Validators.required],
    });
  }

  setInitialDate(date: string) {
    this.selectedDate = date;
    this.eventForm.patchValue({ date });
  }

  async onSave() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;
      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formValue.name,
        date: formValue.date,
        time: formValue.time || undefined,
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
}
