/**
 * Google Authentication Service
 * Handles Google OAuth and Drive API integration
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  webContentLink?: string;
}

class GoogleAuthService {
  private clientId: string;
  private apiKey: string;
  private discoveryDocs: string[] = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
  ];
  private scopes: string = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
  private gapi: any = null;
  private isInitialized = false;
  private currentUser: GoogleUser | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Check if gapi is already loaded
      if (typeof window !== 'undefined' && window.gapi) {
        this.gapi = window.gapi;
        
        // If client is already available, initialize directly
        if (window.gapi.client) {
          console.log('Google API client already available');
          this.initializeGapi().then(resolve).catch(reject);
        } else {
          // Load client libraries first
          console.log('Loading Google API client libraries...');
          
          // Use a more robust loading approach
          const loadClient = () => {
            if (window.gapi && window.gapi.load) {
              window.gapi.load('client:auth2', () => {
                console.log('Client libraries loaded, waiting for client to be ready...');
                
                // Wait for client to be available
                let attempts = 0;
                const maxAttempts = 50;
                
                const waitForClient = () => {
                  attempts++;
                  if (this.gapi && this.gapi.client) {
                    console.log('Google API client is ready');
                    this.initializeGapi().then(resolve).catch(reject);
                  } else if (attempts >= maxAttempts) {
                    reject(new Error('Google API client failed to load after 5 seconds'));
                  } else {
                    console.log(`Waiting for Google API client... (${attempts}/${maxAttempts})`);
                    setTimeout(waitForClient, 100);
                  }
                };
                
                waitForClient();
              });
            } else {
              // If gapi.load is not available, wait a bit and try again
              console.log('gapi.load not available, retrying...');
              setTimeout(loadClient, 100);
            }
          };
          
          loadClient();
        }
        return;
      }

      // Load Google API script
      if (typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google API script loaded');
          if (window.gapi) {
            window.gapi.load('client:auth2', () => {
              console.log('Google API client loaded');
              this.gapi = window.gapi;
              
              // Wait for client to be available with timeout
              let attempts = 0;
              const maxAttempts = 50; // 5 seconds max wait
              
              const waitForClient = () => {
                attempts++;
                if (this.gapi && this.gapi.client) {
                  console.log('Google API client is ready');
                  this.initializeGapi().then(resolve).catch(reject);
                } else if (attempts >= maxAttempts) {
                  reject(new Error('Google API client failed to load after 5 seconds'));
                } else {
                  console.log(`Waiting for Google API client... (${attempts}/${maxAttempts})`);
                  setTimeout(waitForClient, 100);
                }
              };
              
              waitForClient();
            });
          } else {
            reject(new Error('Google API not available after script load'));
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load Google API script');
          reject(new Error('Failed to load Google API script'));
        };
        
        document.head.appendChild(script);
      } else {
        reject(new Error('Window object not available'));
      }
    });
  }

  private async initializeGapi(): Promise<void> {
    try {
      // Validate gapi and client
      if (!this.gapi) {
        throw new Error('Google API not loaded');
      }
      if (!this.gapi.client) {
        throw new Error('Google API client not available');
      }
      if (typeof this.gapi.client.init !== 'function') {
        throw new Error('Google API client.init is not a function');
      }

      // Validate credentials
      if (!this.clientId) {
        throw new Error('Google Client ID is not configured. Please check your .env file.');
      }
      if (!this.apiKey) {
        throw new Error('Google API Key is not configured. Please check your .env file.');
      }

      console.log('Initializing Google API with Client ID:', this.clientId.substring(0, 20) + '...');
      
      await this.gapi.client.init({
        apiKey: this.apiKey,
        clientId: this.clientId,
        discoveryDocs: this.discoveryDocs,
        scope: this.scopes
      });

      this.isInitialized = true;
      console.log('Google API initialized successfully');
      
      // Check if user is already signed in
      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        this.currentUser = this.mapGoogleUser(user);
        console.log('User already signed in:', this.currentUser.email);
      }
    } catch (error) {
      console.error('Error initializing Google API:', error);
      
      // Try to get more specific error information
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        // Handle Google API specific errors
        if ('error' in error) {
          errorMessage = `Google API Error: ${JSON.stringify(error.error)}`;
        } else if ('details' in error) {
          errorMessage = `Google API Error: ${JSON.stringify(error.details)}`;
        } else {
          errorMessage = `Google API Error: ${JSON.stringify(error)}`;
        }
      }
      
      throw new Error(`Failed to initialize Google API: ${errorMessage}`);
    }
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      this.currentUser = this.mapGoogleUser(user);
      
      // Store user info in localStorage
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.currentUser = null;
      localStorage.removeItem('google_user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  getCurrentUser(): GoogleUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from localStorage
    const stored = localStorage.getItem('google_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (error) {
        localStorage.removeItem('google_user');
      }
    }

    return null;
  }

  isSignedIn(): boolean {
    return this.currentUser !== null;
  }

  private mapGoogleUser(googleUser: any): GoogleUser {
    const profile = googleUser.getBasicProfile();
    const authResponse = googleUser.getAuthResponse(true);
    
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl(),
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token
    };
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      await user.reloadAuthResponse();
      
      const authResponse = user.getAuthResponse(true);
      this.currentUser!.accessToken = authResponse.access_token;
      
      // Update stored user
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      
      return authResponse.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not signed in');
    }

    // Check if token is expired (basic check)
    const tokenExpiry = localStorage.getItem('google_token_expiry');
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      return await this.refreshAccessToken();
    }

    return this.currentUser.accessToken;
  }
}

export const googleAuthService = new GoogleAuthService();
