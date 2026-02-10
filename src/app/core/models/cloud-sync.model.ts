export interface CloudSyncSettings {
  enabled: boolean;
  provider: CloudProvider;
  frequency: SyncFrequency;
  lastSyncDate?: number;
  nextSyncDate?: number;
  accessToken?: string;
  refreshToken?: string;
  folderPath?: string; // User-selectable folder path
  folderId?: string; // Google Drive folder ID
}

export enum CloudProvider {
  GOOGLE_DRIVE = 'google_drive',
  DROPBOX = 'dropbox',
  ONEDRIVE = 'onedrive',
}

export enum SyncFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface CloudSyncStatus {
  isAuthenticated: boolean;
  lastSync?: Date;
  nextSync?: Date;
  syncInProgress: boolean;
  error?: string;
}
