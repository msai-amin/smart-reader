import React from 'react'
import { Upload, MessageCircle, Settings, FileText, Library, User, Cloud } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { DocumentUpload } from './DocumentUpload'
import { TypographySettings } from './TypographySettings'
import { LibraryModal } from './LibraryModal'
import { AuthModal } from './AuthModal'
import { googleAuthService, GoogleUser } from '../services/googleAuthService'

export const Header: React.FC = () => {
  const { toggleChat, currentDocument } = useAppStore()
  const [showUpload, setShowUpload] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showLibrary, setShowLibrary] = React.useState(false)
  const [showAuth, setShowAuth] = React.useState(false)
  const [user, setUser] = React.useState<GoogleUser | null>(null)

  React.useEffect(() => {
    // Check if user is already signed in
    const currentUser = googleAuthService.getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleAuthChange = (newUser: GoogleUser | null) => {
    setUser(newUser)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">AI Reader Assistant</h1>
          </div>

          {/* Document Info */}
          {currentDocument && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="truncate max-w-xs">{currentDocument.name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLibrary(true)}
              className="btn-ghost flex items-center space-x-2"
            >
              <Library className="w-4 h-4" />
              <span>Library</span>
            </button>

            <button
              onClick={() => setShowUpload(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Auth Button */}
            <button
              onClick={() => setShowAuth(true)}
              className={`btn-ghost flex items-center space-x-2 ${user ? 'text-green-600' : ''}`}
            >
              {user ? (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Sync</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
            
            <button
              onClick={toggleChat}
              className="btn-primary flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAuth && (
        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)} 
          onAuthChange={handleAuthChange}
        />
      )}

      {showLibrary && (
        <LibraryModal isOpen={showLibrary} onClose={() => setShowLibrary(false)} />
      )}

      {showUpload && (
        <DocumentUpload onClose={() => setShowUpload(false)} />
      )}
      
      {showSettings && (
        <TypographySettings onClose={() => setShowSettings(false)} />
      )}
    </header>
  )
}


