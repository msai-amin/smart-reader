// Modern Google Identity Services implementation
// This uses the newer Google Identity Services instead of the deprecated gapi.auth2

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

class GoogleIdentityService {
  private clientId: string;
  private isInitialized = false;
  private currentUser: GoogleUser | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    
    if (!this.clientId) {
      console.error('Google Client ID is not configured');
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Check if Google Identity Services is already loaded
      if (typeof window !== 'undefined' && window.google) {
        console.log('Google Identity Services already loaded');
        this.initializeGoogleIdentity().then(resolve).catch(reject);
        return;
      }

      // Wait for Google Identity Services to load
      const checkGoogle = () => {
        if (window.google && window.google.accounts) {
          console.log('Google Identity Services loaded');
          this.initializeGoogleIdentity().then(resolve).catch(reject);
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      // Start checking after a short delay
      setTimeout(checkGoogle, 100);
    });
  }

  private async initializeGoogleIdentity(): Promise<void> {
    try {
      if (!window.google || !window.google.accounts) {
        throw new Error('Google Identity Services not available');
      }

      if (!this.clientId) {
        throw new Error('Google Client ID is not configured');
      }

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        // Add localhost support
        ux_mode: 'popup',
        context: 'signin'
      });

      this.isInitialized = true;
      console.log('Google Identity Services initialized successfully');

      // Check if user is already signed in
      const savedUser = localStorage.getItem('google_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          console.log('User already signed in:', this.currentUser?.email);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('google_user');
        }
      }
    } catch (error) {
      console.error('Error initializing Google Identity Services:', error);
      throw new Error(`Failed to initialize Google Identity Services: ${error}`);
    }
  }

  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    try {
      // Decode the JWT token to get user information
      const payload = this.decodeJWT(response.credential);
      
      this.currentUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name
      };

      // Store user info in localStorage
      localStorage.setItem('google_user', JSON.stringify(this.currentUser));
      
      console.log('User signed in successfully:', this.currentUser.email);
      
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('googleSignIn', { 
        detail: this.currentUser 
      }));
    } catch (error) {
      console.error('Error handling credential response:', error);
    }
  }

  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Failed to decode JWT token');
    }
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.accounts) {
        reject(new Error('Google Identity Services not available'));
        return;
      }

      // Set up a one-time listener for the sign-in event
      const handleSignIn = (event: CustomEvent) => {
        window.removeEventListener('googleSignIn', handleSignIn as EventListener);
        if (this.currentUser) {
          resolve(this.currentUser);
        } else {
          reject(new Error('Sign in failed'));
        }
      };

      window.addEventListener('googleSignIn', handleSignIn as EventListener);

      // Trigger the sign-in popup
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            window.removeEventListener('googleSignIn', handleSignIn as EventListener);
            reject(new Error('Sign in was cancelled or not displayed'));
          }
        });
      } catch (error) {
        window.removeEventListener('googleSignIn', handleSignIn as EventListener);
        reject(new Error(`Failed to trigger sign in: ${error}`));
      }
    });
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      this.currentUser = null;
      localStorage.removeItem('google_user');
      
      console.log('User signed out successfully');
      
      // Dispatch a custom event to notify components
      window.dispatchEvent(new CustomEvent('googleSignOut'));
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  isSignedIn(): boolean {
    return this.currentUser !== null;
  }
}

// Global type declarations
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const googleIdentityService = new GoogleIdentityService();
