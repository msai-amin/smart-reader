// Simple Google OAuth implementation using the most basic approach
// This should be more reliable than the complex Identity Services approach

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

class SimpleGoogleAuth {
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
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        console.log('Google Identity Services already loaded');
        this.isInitialized = true;
        resolve();
        return;
      }

      // Wait for Google Identity Services to load
      const checkGoogle = () => {
        if (window.google && window.google.accounts) {
          console.log('Google Identity Services loaded');
          this.isInitialized = true;
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      // Start checking after a short delay
      setTimeout(checkGoogle, 100);
    });
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

  private handleCredentialResponse = (response: any) => {
    try {
      console.log('Received credential response:', response);
      
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
  };

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

      // Use the simplest possible approach - just call prompt
      try {
        console.log('Attempting Google sign-in...');
        
        // Initialize with callback
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse
        });

        // Try to show the prompt
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Prompt notification:', notification);
          
          if (notification.isNotDisplayed()) {
            console.log('Prompt not displayed, trying renderButton approach...');
            
            // Fallback: create a button and click it
            const buttonDiv = document.createElement('div');
            buttonDiv.style.position = 'fixed';
            buttonDiv.style.top = '-1000px';
            buttonDiv.style.left = '-1000px';
            document.body.appendChild(buttonDiv);

            window.google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'signin_with',
              callback: this.handleCredentialResponse
            });

            // Click the button programmatically
            setTimeout(() => {
              const button = buttonDiv.querySelector('div[role="button"]') as HTMLElement;
              if (button) {
                button.click();
              } else {
                document.body.removeChild(buttonDiv);
                reject(new Error('Could not create sign-in button'));
              }
            }, 100);
          } else if (notification.isSkippedMoment()) {
            window.removeEventListener('googleSignIn', handleSignIn as EventListener);
            reject(new Error('Sign in was skipped by user'));
          } else if (notification.isDismissedMoment()) {
            window.removeEventListener('googleSignIn', handleSignIn as EventListener);
            reject(new Error('Sign in was dismissed by user'));
          }
        });
      } catch (error) {
        console.error('Error during sign-in:', error);
        window.removeEventListener('googleSignIn', handleSignIn as EventListener);
        reject(new Error(`Sign-in failed: ${error}`));
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
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export const simpleGoogleAuth = new SimpleGoogleAuth();
