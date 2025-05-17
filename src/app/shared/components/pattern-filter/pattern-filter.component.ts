import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButtons, IonToolbar, IonSelect, IonButton, IonTitle, IonHeader, IonList, IonContent, IonItem, IonInput } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';

const LOCAL_STORAGE_KEY = 'pattern-filter';

@Component({
  selector: 'app-pattern-filter',
  standalone: true,
  imports: [IonInput, IonItem, IonContent, IonList, IonHeader, IonTitle, IonButton, IonToolbar, IonButtons, IonSelect, ReactiveFormsModule],
  templateUrl: './pattern-filter.component.html',
  styleUrl: './pattern-filter.component.css',
})
export class PatternFilterComponent implements OnInit {
  filterForm!: FormGroup;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private fb: FormBuilder,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      minVolume: [null],
      maxVolume: [null],
      minLength: [null],
      maxLength: [null],
      category: [[]],
      minRatio: [null],
      maxRatio: [null],
      minPump: [null],
      maxPump: [null],
      minForwardVolume: [null],
      maxForwardVolume: [null],
      minReverseVolume: [null],
      maxReverseVolume: [null],
    });
    this.loadFiltersFromLocalStorage();

    // Example: Log active filter count on init or when form changes
    // console.log('Active filters on init:', this.getActiveFilterCount());
    // this.filterForm.valueChanges.subscribe(() => {
    //   console.log('Active filters changed:', this.getActiveFilterCount());
    // });
  }

  loadFiltersFromLocalStorage(): void {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedFilters) {
      try {
        const filterData = JSON.parse(savedFilters);
        this.filterForm.patchValue(filterData);
      } catch (e) {
        console.error('Error parsing saved filters from localStorage', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
      }
    }
  }

  saveFiltersToLocalStorage(): void {
    if (this.filterForm) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.filterForm.value));
    }
  }

  getActiveFilterCount(): number {
    if (!this.filterForm) {
      return 0;
    }
    let activeCount = 0;
    const formValues = this.filterForm.value;

    for (const key in formValues) {
      if (Object.prototype.hasOwnProperty.call(formValues, key)) {
        const value = formValues[key];
        if (key === 'category') {
          // Active if the array is not null and has elements
          if (Array.isArray(value) && value.length > 0) {
            activeCount++;
          }
        } else {
          // Active if the value is not null (assuming null is the default for other fields)
          if (value !== null) {
            activeCount++;
          }
        }
      }
    }
    return activeCount;
  }

  reset() {
    if (this.filterForm) {
      this.filterForm.reset({
        minVolume: null,
        maxVolume: null,
        minLength: null,
        maxLength: null,
        category: [],
        minRatio: null,
        maxRatio: null,
        minPump: null,
        maxPump: null,
        minForwardVolume: null,
        maxForwardVolume: null,
        minReverseVolume: null,
        maxReverseVolume: null,
      }); // Resets to initial values
      // Optionally, clear from localStorage as well if "reset" means full reset
      // localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  cancel(): Promise<boolean> {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm(): void {
    if (this.filterForm && this.filterForm.valid) {
      const filterData = this.filterForm.value;
      // Optionally save filters when confirming
      this.saveFiltersToLocalStorage();
      this.http.post(`${environment.patternEndpoint}/filter`, filterData).subscribe({
        next: (response) => {
          this.modalCtrl.dismiss(response, 'confirm');
        },
        error: (error) => {
          console.error('Error during filter request', error);
          this.modalCtrl.dismiss(null, 'error');
        },
      });
    } else {
      this.toastService.showToast(ToastMessages.patternLoadError, 'bug', true);
      // Optionally, mark all fields as touched to show validation errors
      // this.filterForm.markAllAsTouched();
    }
  }
}
