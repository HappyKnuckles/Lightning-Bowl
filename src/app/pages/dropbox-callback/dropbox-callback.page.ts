import { Component, OnInit } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dropbox-callback',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="ion-padding ion-text-center">
      <div style="margin-top: 50%; transform: translateY(-50%);">
        <ion-spinner name="crescent"></ion-spinner>
        <p style="margin-top: 20px;">Completing Dropbox authentication...</p>
      </div>
    </ion-content>
  `,
})
export class DropboxCallbackPage implements OnInit {
  ngOnInit(): void {
    // Extract authorization code from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (window.opener) {
      if (code) {
        // Send success message to parent window
        window.opener.postMessage(
          {
            type: 'dropbox-auth-success',
            code: code,
          },
          window.location.origin,
        );
      } else {
        // Send error message to parent window
        window.opener.postMessage(
          {
            type: 'dropbox-auth-error',
            error: errorDescription || error || 'No authorization code received',
          },
          window.location.origin,
        );
      }
      // Close this window
      window.close();
    } else {
      // If no opener (shouldn't happen), redirect to settings
      window.location.href = '/tabs/settings';
    }
  }
}
