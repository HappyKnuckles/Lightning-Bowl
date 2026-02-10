import { Component, OnInit } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [IonContent, IonSpinner],
  template: `
    <ion-content class="ion-padding ion-text-center">
      <div style="margin-top: 50%; transform: translateY(-50%);">
        <ion-spinner name="crescent"></ion-spinner>
        <p style="margin-top: 20px;">Completing authentication...</p>
      </div>
    </ion-content>
  `,
})
export class AuthCallbackPage implements OnInit {
  ngOnInit(): void {
    // Extract access token from URL fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (window.opener) {
      if (accessToken) {
        // Send success message to parent window
        window.opener.postMessage(
          {
            type: 'google-auth-success',
            accessToken: accessToken,
          },
          window.location.origin,
        );
      } else {
        // Send error message to parent window
        window.opener.postMessage(
          {
            type: 'google-auth-error',
            error: error || 'No access token received',
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
