import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bookOutline, chevronBack, libraryOutline } from 'ionicons/icons';
import { RulebookService } from 'src/app/core/services/rulebook/rulebook.service';
import { BowlingOrganization, Rulebook } from 'src/app/core/models/rulebook.model';
import { ToastService } from 'src/app/core/services/toast/toast.service';

@Component({
  selector: 'app-rulebook-selector',
  templateUrl: './rulebook-selector.component.html',
  styleUrls: ['./rulebook-selector.component.scss'],
  standalone: true,
  imports: [
    IonList,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonButtons,
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonModal,
    IonButton,
    IonLabel,
    IonSelectOption,
    IonSelect,
    IonIcon,
    IonItem,
    NgIf,
    NgFor,
    FormsModule,
  ],
})
export class RulebookSelectorComponent implements OnInit {
  organizations: BowlingOrganization[] = [];
  selectedOrganization: BowlingOrganization | null = null;
  currentRulebook: Rulebook | null = null;
  isRulebookModalOpen = false;
  selectedValue = '';

  constructor(
    private rulebookService: RulebookService,
    private toastService: ToastService
  ) {
    addIcons({
      bookOutline,
      chevronBack,
      libraryOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.organizations = await this.rulebookService.getAvailableOrganizations();
    this.selectedOrganization = await this.rulebookService.getSelectedOrganization();
    this.selectedValue = this.selectedOrganization?.code || '';
  }

  async onOrganizationChange(event: { detail: { value: string } }): Promise<void> {
    const selectedCode = event.detail.value;
    
    if (selectedCode === 'view' && this.selectedOrganization) {
      await this.viewRulebook();
      return;
    }

    if (selectedCode === '') {
      this.selectedOrganization = null;
      await this.rulebookService.clearSelectedOrganization();
      this.toastService.showToast('Bowling organization cleared', 'checkmark-outline');
      return;
    }

    const organization = this.organizations.find(org => org.code === selectedCode);
    if (organization) {
      this.selectedOrganization = organization;
      await this.rulebookService.saveSelectedOrganization(organization);
      this.toastService.showToast(`Selected ${organization.name}`, 'checkmark-outline');
    }
  }

  async viewRulebook(): Promise<void> {
    if (!this.selectedOrganization) {
      this.toastService.showToast('Please select a bowling organization first', 'warning-outline', true);
      return;
    }

    try {
      this.currentRulebook = await this.rulebookService.getRulebookForOrganization(this.selectedOrganization);
      this.isRulebookModalOpen = true;
    } catch (error) {
      console.error('Error loading rulebook:', error);
      this.toastService.showToast('Error loading rulebook', 'bug-outline', true);
    }
  }

  closeRulebookModal(): void {
    this.isRulebookModalOpen = false;
    this.selectedValue = this.selectedOrganization?.code || '';
  }
}