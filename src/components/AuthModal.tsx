import { useState, useEffect } from 'react';
import { X, LogIn, LogOut, User, Cloud, HardDrive } from 'lucide-react';
import { simpleGoogleAuth, GoogleUser } from '../services/simpleGoogleAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange: (user: GoogleUser | null) => void;
}

export function AuthModal({ isOpen, onClose, onAuthChange }: AuthModalProps) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Check if user is already signed in
      const currentUser = simpleGoogleAuth.getCurrentUser();
      setUser(currentUser);
      onAuthChange(currentUser);
    }
  }, [isOpen, onAuthChange]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting Google authentication...');
      await simpleGoogleAuth.initialize();
      console.log('Simple Google Auth initialized, attempting sign in...');
      const user = await simpleGoogleAuth.signIn();
      console.log('Sign in successful:', user.email);
      setUser(user);
      onAuthChange(user);
    } catch (err) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await simpleGoogleAuth.signOut();
      setUser(null);
      onAuthChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🔐 Authentication</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {user ? (
              // Signed in state
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span>Google Drive sync enabled</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span>Local storage available</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSignOut}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>
            ) : (
              // Not signed in state
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Sign in to Google
                  </h3>
                  <p className="text-sm text-gray-600">
                    Access your Google Drive to sync books, notes, and audio files across devices
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <span>Sync with Google Drive</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span>Keep local backup</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-green-500" />
                    <span>Secure authentication</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Your data is encrypted and secure. We only access files you explicitly save.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
