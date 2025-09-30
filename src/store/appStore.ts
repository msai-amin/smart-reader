import { create } from 'zustand'

export interface Document {
  id: string
  name: string
  content: string
  type: 'text' | 'pdf'
  uploadedAt: Date
  // PDF-specific properties
  pdfData?: ArrayBuffer
  totalPages?: number
  pageTexts?: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface TypographySettings {
  fontFamily: 'serif' | 'sans' | 'mono'
  fontSize: number
  lineHeight: number
  maxWidth: number
  theme: 'light' | 'dark' | 'sepia'
}

export interface PDFViewerSettings {
  currentPage: number
  zoom: number
  scale: number
  rotation: number
  viewMode: 'text' | 'pdf' | 'split'
  scrollMode: 'single' | 'continuous'
  showPageNumbers: boolean
  showProgress: boolean
}

interface AppState {
  // Document state
  currentDocument: Document | null
  documents: Document[]
  
  // UI state
  isChatOpen: boolean
  isLoading: boolean
  
  // Typography settings
  typography: TypographySettings
  
  // PDF viewer settings
  pdfViewer: PDFViewerSettings
  
  // Chat state
  chatMessages: ChatMessage[]
  isTyping: boolean
  
  // Actions
  setCurrentDocument: (document: Document | null) => void
  addDocument: (document: Document) => void
  removeDocument: (id: string) => void
  toggleChat: () => void
  setLoading: (loading: boolean) => void
  updateTypography: (settings: Partial<TypographySettings>) => void
  updatePDFViewer: (settings: Partial<PDFViewerSettings>) => void
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChat: () => void
  setTyping: (typing: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentDocument: null,
  documents: [],
  isChatOpen: false,
  isLoading: false,
  typography: {
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 1.75,
    maxWidth: 800,
    theme: 'light'
  },
  pdfViewer: {
    currentPage: 1,
    zoom: 1.0,
    scale: 1.0,
    rotation: 0,
    viewMode: 'pdf',
    scrollMode: 'single',
    showPageNumbers: true,
    showProgress: true
  },
  chatMessages: [],
  isTyping: false,
  
  // Actions
  setCurrentDocument: (document) => set({ currentDocument: document }),
  
  addDocument: (document) => set((state) => ({
    documents: [...state.documents, document],
    currentDocument: document
  })),
  
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter(doc => doc.id !== id),
    currentDocument: state.currentDocument?.id === id ? null : state.currentDocument
  })),
  
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  updateTypography: (settings) => set((state) => ({
    typography: { ...state.typography, ...settings }
  })),
  
  updatePDFViewer: (settings) => set((state) => ({
    pdfViewer: { ...state.pdfViewer, ...settings }
  })),
  
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }]
  })),
  
  clearChat: () => set({ chatMessages: [] }),
  
  setTyping: (typing) => set({ isTyping: typing })
}))


