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
      // Load Google API script
      if (typeof window !== 'undefined' && !window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          window.gapi.load('client:auth2', () => {
            this.gapi = window.gapi;
            this.initializeGapi().then(resolve).catch(reject);
          });
        };
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
      } else if (window.gapi) {
        this.gapi = window.gapi;
        this.initializeGapi().then(resolve).catch(reject);
      } else {
        reject(new Error('Google API not available'));
      }
    });
  }

  private async initializeGapi(): Promise<void> {
    try {
      await this.gapi.client.init({
        apiKey: this.apiKey,
        clientId: this.clientId,
        discoveryDocs: this.discoveryDocs,
        scope: this.scopes
      });

      this.isInitialized = true;
      
      // Check if user is already signed in
      const authInstance = this.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        const user = authInstance.currentUser.get();
        this.currentUser = this.mapGoogleUser(user);
      }
    } catch (error) {
      console.error('Error initializing Google API:', error);
      throw new Error('Failed to initialize Google API');
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
