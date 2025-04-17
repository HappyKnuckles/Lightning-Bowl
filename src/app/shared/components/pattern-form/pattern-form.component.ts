import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonLabel, IonItem, IonInput, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { startWith, combineLatest, Observable, combineLatestWith } from 'rxjs';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { ForwardsData, Pattern, ReverseData } from 'src/app/core/models/pattern.model';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { ToastService } from 'src/app/core/services/toast/toast.service';

@Component({
  selector: 'app-pattern-form',
  standalone: true,
  imports: [CommonModule, IonInput, IonItem, IonLabel, IonButton, IonIcon, ReactiveFormsModule],
  templateUrl: './pattern-form.component.html',
  styleUrl: './pattern-form.component.css'
})
export class PatternFormComponent implements OnInit {
  constructor(private fb: FormBuilder, private patternService: PatternService, private loadingService: LoadingService, private toastService: ToastService) {

    addIcons({trashOutline});
  }

  patternForm = this.fb.group({
    title: ['', Validators.required],
    category: 'Custom Patterns',
    distance: ['', Validators.required],
    ratio: ['', [Validators.required, Validators.pattern(/^\d+:\d+$/)]],
    volume: ['', Validators.required],
    forward: ['', Validators.required],
    reverse: ['', Validators.required],
    pump: ['', Validators.required],
    tanks: [''],
    forwards_data: this.fb.array<FormControl<ForwardsData>>([]),
    reverse_data: this.fb.array<FormControl<ReverseData>>([]),
  });

  ngOnInit() {
    // ...existing initialization code...
    
    // Add listeners for forward and reverse oil changes
    const forwardControl = this.patternForm.get('forward');
    const reverseControl = this.patternForm.get('reverse');
    const volumeControl = this.patternForm.get('volume');
    
    if (forwardControl && reverseControl && volumeControl) {
      forwardControl.valueChanges.pipe(
        startWith(forwardControl.value ?? 0),
        combineLatestWith(
          reverseControl.valueChanges.pipe(
            startWith(reverseControl.value ?? 0)
          )
        )
      ).subscribe(([forward, reverse]) => {
        const forwardValue = Number(forward) || 0;
        const reverseValue = Number(reverse) || 0;
        volumeControl.setValue((forwardValue + reverseValue).toString(), {emitEvent: false});
      });
    }
  }

  get forwardsDataArray(): FormArray {
    return this.patternForm.get('forwards_data') as FormArray;
  }

  get reverseDataArray(): FormArray {
    return this.patternForm.get('reverse_data') as FormArray;
  }

  // Create a form group for ForwardsData
  createForwardsDataGroup(): FormGroup {
    return this.fb.group({
      number: [''],
      start: [''],
      stop: [''],
      load: [''],
      mics: [''],
      speed: [''],
      buf: [''],
      tank: [''],
      total_oil: [''],
      distance_start: [''],
      distance_end: ['']
    });
  }

  // Create a form group for ReverseData
  createReverseDataGroup(): FormGroup {
    return this.fb.group({
      number: [''],
      start: [''],
      stop: [''],
      load: [''],
      mics: [''],
      speed: [''],
      buf: [''],
      tank: [''],
      total_oil: [''],
      distance_start: [''],
      distance_end: ['']
    });
  }

  // Add new forward data entry
  addForwardData() {
    this.forwardsDataArray.push(this.createForwardsDataGroup());
  }

  // Add new reverse data entry
  addReverseData() {
    this.reverseDataArray.push(this.createReverseDataGroup());
  }

  // Remove entry by index
  removeForwardData(index: number) {
    this.forwardsDataArray.removeAt(index);
  }

  removeReverseData(index: number) {
    this.reverseDataArray.removeAt(index);
  }

  async onSubmit() {
    if(!this.patternForm.valid){
      return;
    }

    const pattern: Partial<Pattern> = {
      title: this.patternForm.value.title || '',
      category: this.patternForm.value.category || '',
      distance: this.patternForm.value.distance || '',
      ratio: this.patternForm.value.ratio || '',
      volume: this.patternForm.value.volume || '',
      forward: this.patternForm.value.forward || '',
      reverse: this.patternForm.value.reverse || '',
      pump: this.patternForm.value.pump || '',
      tanks: this.patternForm.value.tanks || '',
      forwards_data: this.patternForm.value.forwards_data || [],
      reverse_data: this.patternForm.value.reverse_data || [],
    };
    try {
      this.loadingService.setLoading(true); 
      await this.patternService.addPattern(pattern)
      this.toastService.showToast(ToastMessages.patternAddSuccess, 'checkmark');
    } catch (error) {
      console.error('Error adding pattern:', error);
      this.toastService.showToast(ToastMessages.patternAddError, 'bug', true);
    } finally{
      this.loadingService.setLoading(false); 
    }
  }
}
