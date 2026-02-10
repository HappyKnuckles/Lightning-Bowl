import { Injectable, signal, computed } from '@angular/core';
import { CloudSyncSettings, CloudProvider, SyncFrequency, CloudSyncStatus } from '../../models/cloud-sync.model';
import { StorageService } from '../storage/storage.service';
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

  private syncIntervalId?: number;

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
    private storageService: StorageService,
  ) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.storage.create();
    await this.loadSettings();
    this.scheduleNextSync();
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
    this.#settings.set(updatedSettings);
    await this.storage.set(CLOUD_SYNC_STORAGE_KEY, updatedSettings);

    // Reschedule sync if frequency or enabled status changed
    if (settings.frequency !== undefined || settings.enabled !== undefined) {
      this.scheduleNextSync();
    }
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
      this.toastService.showToast(`Authentication failed: ${errorMessage}`, 'close-circle', true);
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
          this.updateSettings({
            provider: CloudProvider.GOOGLE_DRIVE,
            accessToken,
            enabled: true,
          });

          this.#syncStatus.update((status) => ({
            ...status,
            isAuthenticated: true,
            error: undefined,
          }));

          this.toastService.showToast('Google Drive connected successfully!', 'checkmark-circle');
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

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }

    this.toastService.showToast('Cloud sync disconnected', 'cloud-offline');
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

      this.toastService.showToast('Excel file synced to cloud successfully!', 'cloud-done');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      this.#syncStatus.update((status) => ({
        ...status,
        syncInProgress: false,
        error: errorMessage,
      }));
      this.toastService.showToast(`Sync failed: ${errorMessage}`, 'cloud-offline', true);
      throw error;
    }
  }

  private async generateExcelBuffer(): Promise<ArrayBuffer> {
    // Import ExcelJS dynamically to generate the workbook
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    // Get game data
    const gameData = this.getGameDataForExport(this.storageService.games());
    const gameWorksheet = workbook.addWorksheet('Game History');

    if (gameData.length > 0) {
      const headers = Object.keys(gameData[0]);
      this.addTable(gameWorksheet, 'GameHistoryTable', 'A1', headers, gameData);
      this.setColumnWidths(gameWorksheet, headers, gameData, 1);
    }

    return await workbook.xlsx.writeBuffer();
  }

  private getGameDataForExport(games: any[]): Record<string, any>[] {
    // Simplified version - in production, use the full implementation from ExcelService
    return games.map((game) => ({
      Game: game.gameId,
      Date: new Date(game.date).toLocaleDateString(),
      'Total Score': game.totalScore,
      League: game.league || '',
      Practice: game.isPractice ? 'true' : 'false',
    }));
  }

  private addTable(worksheet: any, name: string, ref: string, headers: string[], rows: Record<string, any>[]): void {
    worksheet.addTable({
      name,
      ref,
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium1', showRowStripes: true },
      columns: headers.map((header) => ({ name: header })),
      rows: rows.map((row) => headers.map((header) => row[header])),
    });
  }

  private setColumnWidths(worksheet: any, headers: string[], data: Record<string, any>[], startIndex: number): void {
    headers.forEach((header, index) => {
      const maxContentLength = Math.max(header.length, ...data.map((row) => (row[header] ?? '').toString().length));
      worksheet.getColumn(startIndex + index).width = maxContentLength + 1;
    });
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

    // Create file metadata
    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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

  private scheduleNextSync(): void {
    // Clear existing interval
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = undefined;
    }

    const settings = this.#settings();
    if (!settings.enabled || !settings.accessToken) {
      return;
    }

    // Calculate next sync date if not set
    if (!settings.nextSyncDate) {
      const nextSync = this.calculateNextSyncDate(settings.frequency);
      this.updateSettings({ nextSyncDate: nextSync });
    }

    // Check every hour if it's time to sync
    this.syncIntervalId = window.setInterval(
      () => {
        this.checkAndSync();
      },
      60 * 60 * 1000,
    ); // Check every hour

    // Also check immediately
    this.checkAndSync();
  }

  private async checkAndSync(): Promise<void> {
    const settings = this.#settings();
    const now = Date.now();

    if (settings.enabled && settings.nextSyncDate && now >= settings.nextSyncDate) {
      try {
        await this.syncNow();
      } catch (error) {
        console.error('Automatic sync failed:', error);
      }
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
