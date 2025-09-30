// import React from 'react'
import { DocumentViewer } from './components/DocumentViewer'
import { ChatModal } from './components/ChatModal'
import { Header } from './components/Header'
import { useAppStore } from './store/appStore'

function App() {
  const { isChatOpen, toggleChat } = useAppStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <DocumentViewer />
      </main>
      
      {isChatOpen && (
        <ChatModal onClose={() => toggleChat()} />
      )}
    </div>
  )
}

export default App


