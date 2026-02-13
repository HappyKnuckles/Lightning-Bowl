// Type definitions for Google Identity Services
// https://developers.google.com/identity/oauth2/web/guides/use-token-model

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
        error_uri?: string;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: ClientConfigError) => void;
        prompt?: '' | 'none' | 'consent' | 'select_account';
      }

      interface ClientConfigError {
        type: string;
        message?: string;
      }

      interface OverridableTokenClientConfig {
        prompt?: '' | 'none' | 'consent' | 'select_account';
        hint?: string;
        state?: string;
      }

      interface TokenClient {
        requestAccessToken(config?: OverridableTokenClientConfig): void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;

      function hasGrantedAllScopes(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
      function hasGrantedAnyScope(tokenResponse: TokenResponse, ...scopes: string[]): boolean;
      function revoke(accessToken: string, done?: () => void): void;
    }
  }
}
