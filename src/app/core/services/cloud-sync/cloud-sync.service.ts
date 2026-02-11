import { Injectable, signal, computed } from '@angular/core';
import { CloudSyncSettings, CloudProvider, SyncFrequency, CloudSyncStatus } from '../../models/cloud-sync.model';
import { ExcelService } from '../excel/excel.service';
import { ToastService } from '../toast/toast.service';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';

const CLOUD_SYNC_STORAGE_KEY = 'cloud_sync_settings';

@Injectable({
  providedIn: 'root',
})
export class CloudSyncService {
  #settings = signal<CloudSyncSettings>({
    enabled: false,
    provider: CloudProvider.GOOGLE_DRIVE,
    frequency: SyncFrequency.WEEKLY,
  });

  #syncStatus = signal<CloudSyncStatus>({
    isAuthenticated: false,
    syncInProgress: false,
  });

  readonly settings = this.#settings.asReadonly();
  readonly syncStatus = this.#syncStatus.asReadonly();

  readonly isConfigured = computed(() => {
    const settings = this.#settings();
    return settings.enabled && settings.accessToken !== undefined;
  });

  constructor(
    private storage: Storage,
    private excelService: ExcelService,
    private toastService: ToastService,
  ) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.storage.create();
    await this.loadSettings();
    await this.checkAndSyncOnStartup();
  }

  private async loadSettings(): Promise<void> {
    const savedSettings = await this.storage.get(CLOUD_SYNC_STORAGE_KEY);
    if (savedSettings) {
      this.#settings.set(savedSettings);
      this.#syncStatus.update((status) => ({
        ...status,
        isAuthenticated: !!savedSettings.accessToken,
        lastSync: savedSettings.lastSyncDate ? new Date(savedSettings.lastSyncDate) : undefined,
        nextSync: savedSettings.nextSyncDate ? new Date(savedSettings.nextSyncDate) : undefined,
      }));
    }
  }

  async updateSettings(settings: Partial<CloudSyncSettings>): Promise<void> {
    const currentSettings = this.#settings();
    const updatedSettings = { ...currentSettings, ...settings };

    // If frequency is being updated and we have a lastSyncDate, recalculate nextSyncDate
    if (settings.frequency !== undefined && currentSettings.lastSyncDate) {
      const now = Date.now();
      const calculatedNextSync = this.calculateNextSyncDate(settings.frequency, currentSettings.lastSyncDate);

      // If the calculated next sync is in the past, sync now
      if (calculatedNextSync < now) {
        // First update the settings with the new frequency
        this.#settings.set(updatedSettings);
        await this.storage.set(CLOUD_SYNC_STORAGE_KEY, updatedSettings);

        // Then trigger immediate sync (this will update lastSyncDate and nextSyncDate)
        try {
          await this.syncNow();
        } catch (error) {
          console.error('Automatic sync after frequency change failed:', error);
          // Even if sync fails, calculate next sync from now
          const newNextSync = this.calculateNextSyncDate(settings.frequency, now);
          updatedSettings.nextSyncDate = newNextSync;
          this.#syncStatus.update((status) => ({
            ...status,
            nextSync: new Date(newNextSync),
          }));
          this.#settings.set(updatedSettings);
          await this.storage.set(CLOUD_SYNC_STORAGE_KEY, updatedSettings);
        }
        return;
      }

      // Next sync is in the future, just update it
      updatedSettings.nextSyncDate = calculatedNextSync;
      this.#syncStatus.update((status) => ({
        ...status,
        nextSync: new Date(calculatedNextSync),
      }));
    }

    this.#settings.set(updatedSettings);
    await this.storage.set(CLOUD_SYNC_STORAGE_KEY, updatedSettings);
  }

  async authenticateWithProvider(provider: CloudProvider): Promise<void> {
    this.#syncStatus.update((status) => ({ ...status, error: undefined }));

    try {
      switch (provider) {
        case CloudProvider.GOOGLE_DRIVE:
          await this.authenticateGoogleDrive();
          break;
        case CloudProvider.DROPBOX:
          await this.authenticateDropbox();
          break;
        case CloudProvider.ONEDRIVE:
          await this.authenticateOneDrive();
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      this.#syncStatus.update((status) => ({ ...status, error: errorMessage }));
      this.toastService.showToast('Authentication failed', 'bug-outline', true);
      throw error;
    }
  }

  private async authenticateGoogleDrive(): Promise<void> {
    // Google OAuth2 configuration
    const clientId = environment.googleDriveClientId;
    if (!clientId) {
      throw new Error('Google Drive client ID not configured. Please set googleDriveClientId in environment configuration.');
    }

    const redirectUri = window.location.origin + '/auth/callback';
    const scope = 'https://www.googleapis.com/auth/drive.file';

    // For web-based OAuth flow
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}`;

    // Open OAuth window
    const authWindow = window.open(authUrl, 'Google Drive Authentication', 'width=500,height=600');

    // Listen for the OAuth callback
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'google-auth-success') {
          window.removeEventListener('message', messageHandler);
          authWindow?.close();

          const accessToken = event.data.accessToken;
          const currentSettings = this.#settings();
          const now = Date.now();
          const nextSync = this.calculateNextSyncDate(currentSettings.frequency, now);

          this.updateSettings({
            provider: CloudProvider.GOOGLE_DRIVE,
            accessToken,
            enabled: true,
            nextSyncDate: nextSync,
          });

          this.#syncStatus.update((status) => ({
            ...status,
            isAuthenticated: true,
            error: undefined,
            nextSync: new Date(nextSync),
          }));

          this.toastService.showToast('Google Drive connected successfully!', 'checkmark-outline');
          resolve();
        } else if (event.data.type === 'google-auth-error') {
          window.removeEventListener('message', messageHandler);
          authWindow?.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        authWindow?.close();
        reject(new Error('Authentication timeout'));
      }, 300000);
    });
  }

  private async authenticateDropbox(): Promise<void> {
    // Placeholder for Dropbox authentication
    throw new Error('Dropbox authentication not yet implemented');
  }

  private async authenticateOneDrive(): Promise<void> {
    // Placeholder for OneDrive authentication
    throw new Error('OneDrive authentication not yet implemented');
  }

  async disconnect(): Promise<void> {
    await this.updateSettings({
      enabled: false,
      accessToken: undefined,
      refreshToken: undefined,
    });

    this.#syncStatus.update((status) => ({
      ...status,
      isAuthenticated: false,
      error: undefined,
    }));

    this.toastService.showToast('Cloud sync disconnected', 'checkmark-outline');
  }

  async syncNow(): Promise<void> {
    const settings = this.#settings();

    if (!settings.enabled || !settings.accessToken) {
      throw new Error('Cloud sync is not configured');
    }

    this.#syncStatus.update((status) => ({ ...status, syncInProgress: true, error: undefined }));

    try {
      // Generate Excel file
      const buffer = await this.generateExcelBuffer();

      // Upload to cloud provider
      await this.uploadToCloud(buffer, settings);

      // Update sync status
      const now = Date.now();
      const nextSync = this.calculateNextSyncDate(settings.frequency, now);

      await this.updateSettings({
        lastSyncDate: now,
        nextSyncDate: nextSync,
      });

      this.#syncStatus.update((status) => ({
        ...status,
        syncInProgress: false,
        lastSync: new Date(now),
        nextSync: new Date(nextSync),
      }));

      this.toastService.showToast('Excel file synced to cloud successfully!', 'checkmark-outline');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.#syncStatus.update((status) => ({
        ...status,
        syncInProgress: false,
        error: errorMessage,
      }));
      this.toastService.showToast(`Sync failed.`, 'bug-outline', true);
      throw error;
    }
  }

  private async generateExcelBuffer(): Promise<ArrayBuffer> {
    // Use ExcelService to generate the complete workbook with all data
    return await this.excelService.generateExcelBuffer();
  }

  private async uploadToCloud(buffer: ArrayBuffer, settings: CloudSyncSettings): Promise<void> {
    switch (settings.provider) {
      case CloudProvider.GOOGLE_DRIVE:
        await this.uploadToGoogleDrive(buffer, settings.accessToken!);
        break;
      case CloudProvider.DROPBOX:
        throw new Error('Dropbox upload not yet implemented');
      case CloudProvider.ONEDRIVE:
        throw new Error('OneDrive upload not yet implemented');
    }
  }

  private async uploadToGoogleDrive(buffer: ArrayBuffer, accessToken: string): Promise<void> {
    const date = new Date();
    const formattedDate = date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const fileName = `game_data_${formattedDate}.xlsx`;

    // Get or create the folder
    const settings = this.#settings();
    const folderName = settings.folderPath || 'Lightningbowl Game-History';
    const folderId = await this.getOrCreateFolder(folderName, accessToken);

    // Update settings with folder ID
    if (folderId !== settings.folderId) {
      await this.updateSettings({ folderId });
    }

    // Create file metadata with parent folder
    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      parents: [folderId],
    };

    // Create multipart request
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([buffer], { type: metadata.mimeType }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload to Google Drive');
    }
  }

  private async getOrCreateFolder(folderName: string, accessToken: string): Promise<string> {
    // Search for existing folder
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for folder');
    }

    const searchData = await searchResponse.json();

    // If folder exists, return its ID
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create folder');
    }

    const createData = await createResponse.json();
    return createData.id;
  }

  private async checkAndSyncOnStartup(): Promise<void> {
    const settings = this.#settings();

    if (!settings.enabled || !settings.accessToken) {
      return;
    }

    const now = Date.now();
    const lastSyncDate = settings.lastSyncDate || 0;

    // Calculate if sync is needed based on frequency
    const shouldSync = this.shouldSyncNow(lastSyncDate, settings.frequency, now);

    if (shouldSync) {
      try {
        await this.syncNow();
      } catch (error) {
        console.error('Automatic sync on startup failed:', error);
      }
    }
  }

  private shouldSyncNow(lastSyncDate: number, frequency: SyncFrequency, currentDate: number): boolean {
    if (lastSyncDate === 0) {
      return false; // Never synced before
    }

    const timeSinceLastSync = currentDate - lastSyncDate;
    const oneDayMs = 24 * 60 * 60 * 1000;

    switch (frequency) {
      case SyncFrequency.DAILY:
        return timeSinceLastSync >= oneDayMs;
      case SyncFrequency.WEEKLY:
        return timeSinceLastSync >= 7 * oneDayMs;
      case SyncFrequency.MONTHLY:
        return timeSinceLastSync >= 30 * oneDayMs;
      default:
        return false;
    }
  }

  private calculateNextSyncDate(frequency: SyncFrequency, from: number = Date.now()): number {
    const date = new Date(from);

    switch (frequency) {
      case SyncFrequency.DAILY:
        date.setDate(date.getDate() + 1);
        break;
      case SyncFrequency.WEEKLY:
        date.setDate(date.getDate() + 7);
        break;
      case SyncFrequency.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
    }

    return date.getTime();
  }
}
