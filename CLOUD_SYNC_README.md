# Cloud Sync Feature

This feature allows users to automatically backup their bowling game history Excel files to cloud storage providers.

## Features

- **Cloud Provider Support**: Google Drive (with Dropbox and OneDrive coming soon)
- **Automatic Sync**: Configurable sync schedules (Daily, Weekly, Monthly)
- **Manual Sync**: Sync on-demand with a single button press
- **Settings UI**: Easy-to-use interface in the Settings page

## Setup

### Google Drive Configuration

To enable Google Drive integration, you need to configure OAuth2 credentials:

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Drive API**:

   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

3. **Create OAuth2 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:4200` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:4200/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
   - Save and copy the Client ID

4. **Update Environment Configuration**:

   Edit the following files and add your Google OAuth Client ID:

   - `src/environments/environment.ts` (development)
   - `src/environments/environment.prod.ts` (production)
   - `src/environments/environment.test.ts` (test)

   ```typescript
   export const environment = {
     // ... other config
     googleDriveClientId: "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
   };
   ```

## Usage

### Accessing Cloud Sync Settings

1. Navigate to the **Settings** tab in the app
2. Click on **Cloud Sync** option
3. This opens the Cloud Sync Settings modal

### Connecting to Google Drive

1. Open Cloud Sync Settings
2. Select "Google Drive" as the provider (default)
3. Click "Connect Google Drive"
4. A popup window will open for Google authentication
5. Sign in to your Google account and grant permissions
6. The popup will close and you'll see "Connected" status

### Configuring Automatic Sync

1. After connecting, toggle "Auto-Sync Enabled" to ON
2. Select your preferred sync frequency:
   - **Daily**: Syncs every 24 hours
   - **Weekly**: Syncs every 7 days
   - **Monthly**: Syncs every 30 days
3. The next sync time will be displayed

### Manual Sync

Click the "Sync Now" button at any time to immediately upload your game history to Google Drive.

### Disconnecting

Click the "Disconnect" button to:

- Revoke cloud access
- Disable automatic sync
- Clear stored credentials

## Technical Architecture

### Components

1. **CloudSyncService** (`src/app/core/services/cloud-sync/cloud-sync.service.ts`)

   - Handles authentication with cloud providers
   - Manages sync scheduling
   - Performs file uploads
   - Stores sync settings in IndexedDB

2. **CloudSyncSettingsComponent** (`src/app/shared/components/cloud-sync-settings/`)

   - User interface for cloud sync configuration
   - Real-time status updates using Angular signals
   - Provider selection and frequency configuration

3. **AuthCallbackPage** (`src/app/pages/auth-callback/auth-callback.page.ts`)
   - Handles OAuth2 redirect
   - Extracts access token from URL
   - Sends token to parent window via postMessage

### Data Flow

1. **Authentication**:

   ```
   User clicks "Connect"
   → Opens OAuth popup
   → User authenticates
   → Redirects to /auth/callback
   → Token extracted and sent to parent
   → Token stored in IndexedDB
   ```

2. **Automatic Sync**:

   ```
   Service initializes
   → Loads settings from IndexedDB
   → Schedules next sync based on frequency
   → Checks hourly if sync is due
   → Generates Excel file
   → Uploads to Google Drive
   → Updates next sync date
   ```

3. **Manual Sync**:
   ```
   User clicks "Sync Now"
   → Generates Excel file from current games
   → Uploads to Google Drive
   → Shows success/error toast
   → Updates last sync date
   ```

### Storage

Cloud sync settings are stored in IndexedDB using Ionic Storage:

- **Key**: `cloud_sync_settings`
- **Data**: CloudSyncSettings object containing:
  - enabled: boolean
  - provider: CloudProvider enum
  - frequency: SyncFrequency enum
  - accessToken: string (encrypted by browser)
  - lastSyncDate: number (timestamp)
  - nextSyncDate: number (timestamp)

### Security

- OAuth tokens are stored in IndexedDB (encrypted by the browser)
- Tokens are never logged or exposed
- OAuth flow uses secure HTTPS connections
- Access tokens expire and require re-authentication

## API Endpoints

### Google Drive

- **Upload File**: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`
- **Scope**: `https://www.googleapis.com/auth/drive.file`
  - Only allows access to files created by the app
  - Cannot access other files in user's Drive

## File Naming

Excel files are uploaded with the following naming pattern:

- Format: `game_data_DD.MM.YYYY.xlsx`
- Example: `game_data_10.02.2026.xlsx`

## Error Handling

The service handles various error scenarios:

1. **Authentication Failures**: Shows error toast with details
2. **Upload Failures**: Retries are not automatic; user must sync manually
3. **Missing Configuration**: Warns user if OAuth client ID is not configured
4. **Network Errors**: Gracefully handles offline scenarios

## Future Enhancements

- **Dropbox Integration**: OAuth flow and file upload
- **OneDrive Integration**: OAuth flow and file upload
- **Sync Retry Logic**: Automatic retry on failure with exponential backoff
- **Conflict Resolution**: Handle multiple devices uploading simultaneously
- **Incremental Sync**: Only sync new/changed games
- **Download from Cloud**: Import games from previously uploaded files

## Troubleshooting

### "Authentication failed" error

- Verify OAuth client ID is correctly configured in environment files
- Check that redirect URI matches exactly in Google Cloud Console
- Ensure Google Drive API is enabled

### "Sync failed" error

- Check internet connection
- Verify access token hasn't expired (re-authenticate)
- Check browser console for detailed error messages

### Popup blocked

- Allow popups for the app's domain in browser settings
- Try using manual sync again

## Development Notes

### Testing OAuth Flow

To test the OAuth flow in development:

1. Ensure `googleDriveClientId` is configured in `environment.ts`
2. Run `npm start` to start dev server
3. Navigate to Settings > Cloud Sync
4. Click "Connect Google Drive"
5. Complete authentication in popup
6. Verify connection status updates

### Adding New Cloud Providers

1. Add provider to `CloudProvider` enum in `cloud-sync.model.ts`
2. Implement authentication method in `cloud-sync.service.ts`
3. Implement upload method in `cloud-sync.service.ts`
4. Update UI in `cloud-sync-settings.component.html` to show new provider
5. Test OAuth flow and file upload

## License

This feature is part of Lightning Bowl and follows the same license as the main project.
