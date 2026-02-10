import { Component, inject } from '@angular/core';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonToggle,
  IonNote,
  IonInput,
} from '@ionic/angular/standalone';
import { NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cloudUploadOutline, cloudDoneOutline, cloudOfflineOutline, syncOutline, linkOutline, unlinkOutline } from 'ionicons/icons';
import { CloudSyncService } from 'src/app/core/services/cloud-sync/cloud-sync.service';
import { CloudProvider, SyncFrequency } from 'src/app/core/models/cloud-sync.model';

@Component({
  selector: 'app-cloud-sync-settings',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner,
    IonToggle,
    IonNote,
    IonInput,
  ],
  templateUrl: './cloud-sync-settings.component.html',
  styleUrl: './cloud-sync-settings.component.scss',
})
export class CloudSyncSettingsComponent {
  cloudSyncService = inject(CloudSyncService);

  readonly CloudProvider = CloudProvider;
  readonly SyncFrequency = SyncFrequency;

  selectedProvider: CloudProvider = CloudProvider.GOOGLE_DRIVE;
  selectedFrequency: SyncFrequency = SyncFrequency.WEEKLY;
  folderPath = 'lightningbowl Game-History';

  constructor() {
    addIcons({
      cloudUploadOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
      syncOutline,
      linkOutline,
      unlinkOutline,
    });

    // Initialize from current settings
    const settings = this.cloudSyncService.settings();
    this.selectedProvider = settings.provider;
    this.selectedFrequency = settings.frequency;
    this.folderPath = settings.folderPath || 'lightningbowl Game-History';
  }

  async connectProvider(): Promise<void> {
    try {
      await this.cloudSyncService.authenticateWithProvider(this.selectedProvider);
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }

  async disconnect(): Promise<void> {
    await this.cloudSyncService.disconnect();
  }

  async toggleSync(event: any): Promise<void> {
    const enabled = event.detail.checked;
    await this.cloudSyncService.updateSettings({ enabled });
  }

  async updateProvider(): Promise<void> {
    await this.cloudSyncService.updateSettings({ provider: this.selectedProvider });
  }

  async updateFrequency(): Promise<void> {
    await this.cloudSyncService.updateSettings({ frequency: this.selectedFrequency });
  }

  async updateFolderPath(): Promise<void> {
    if (this.folderPath && this.folderPath.trim()) {
      await this.cloudSyncService.updateSettings({ folderPath: this.folderPath.trim() });
    }
  }

  async syncNow(): Promise<void> {
    try {
      await this.cloudSyncService.syncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }

  getProviderDisplayName(provider: CloudProvider): string {
    switch (provider) {
      case CloudProvider.GOOGLE_DRIVE:
        return 'Google Drive';
      case CloudProvider.DROPBOX:
        return 'Dropbox';
      case CloudProvider.ONEDRIVE:
        return 'OneDrive';
      default:
        return provider;
    }
  }

  getFrequencyDisplayName(frequency: SyncFrequency): string {
    switch (frequency) {
      case SyncFrequency.DAILY:
        return 'Daily';
      case SyncFrequency.WEEKLY:
        return 'Weekly';
      case SyncFrequency.MONTHLY:
        return 'Monthly';
      default:
        return frequency;
    }
  }
}
