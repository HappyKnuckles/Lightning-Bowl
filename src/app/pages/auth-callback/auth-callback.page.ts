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

    // Detect provider from URL or state parameter
    const provider = this.detectProvider(params);

    if (window.opener) {
      if (accessToken) {
        // Send success message to parent window
        window.opener.postMessage(
          {
            type: `${provider}-auth-success`,
            accessToken: accessToken,
          },
          window.location.origin,
        );
      } else {
        // Send error message to parent window
        window.opener.postMessage(
          {
            type: `${provider}-auth-error`,
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

  private detectProvider(params: URLSearchParams): string {
    // Check if there's a state parameter that might contain provider info
    const state = params.get('state');
    if (state) {
      if (state.includes('dropbox')) return 'dropbox';
      if (state.includes('onedrive')) return 'onedrive';
      if (state.includes('google')) return 'google';
    }

    // Fallback: detect from URL structure or domain
    const currentUrl = window.location.href;
    if (currentUrl.includes('dropbox')) return 'dropbox';
    if (currentUrl.includes('microsoft') || currentUrl.includes('live.com')) return 'onedrive';

    // Check referrer if available
    if (document.referrer.includes('dropbox')) return 'dropbox';
    if (document.referrer.includes('microsoft') || document.referrer.includes('live.com')) return 'onedrive';

    // Default to google for backward compatibility
    return 'google';
  }
}
