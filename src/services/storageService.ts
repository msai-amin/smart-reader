/**
 * Storage Service
 * Manages local storage and Google Drive sync for books, notes, and audio files
 */

import { googleAuthService } from './googleAuthService';
import { googleDriveService } from './googleDriveService';

export interface SavedBook {
  id: string;
  title: string;
  fileName: string;
  type: 'pdf' | 'text';
  savedAt: Date;
  lastReadPage?: number;
  totalPages?: number;
  fileData?: ArrayBuffer | string;
  notes?: Note[];
  googleDriveId?: string; // Google Drive file ID for sync
  syncedAt?: Date; // Last sync timestamp
}

export interface Note {
  id: string;
  bookId: string;
  bookName: string;
  content: string;
  pageNumber?: number;
  createdAt: Date;
  updatedAt?: Date;
  lastModified?: Date;
  selectedText?: string;
  googleDocId?: string;
  googleDocUrl?: string;
}

export interface SavedAudio {
  id: string;
  bookId: string;
  title: string;
  audioBlob: Blob;
  duration: number;
  pageRange: { start: number; end: number };
  voiceName: string;
  createdAt: Date;
  googleDriveId?: string; // Google Drive file ID for sync
  syncedAt?: Date; // Last sync timestamp
}

class StorageService {
  private readonly BOOKS_KEY = 'smart_reader_books';
  private readonly NOTES_KEY = 'smart_reader_notes';
  private readonly AUDIO_KEY = 'smart_reader_audio';
  private readonly MAX_STORAGE = 50 * 1024 * 1024; // 50MB limit for localStorage

  // Books Management
  async saveBook(book: SavedBook): Promise<void> {
    try {
      const books = this.getAllBooks();
      const existingIndex = books.findIndex(b => b.id === book.id);
      
      if (existingIndex >= 0) {
        books[existingIndex] = book;
      } else {
        books.push(book);
      }
      
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving book:', error);
      throw new Error('Failed to save book. Storage may be full.');
    }
  }

  getAllBooks(): SavedBook[] {
    try {
      const data = localStorage.getItem(this.BOOKS_KEY);
      if (!data) return [];
      
      const books = JSON.parse(data);
      return books.map((book: any) => ({
        ...book,
        savedAt: new Date(book.savedAt),
      }));
    } catch (error) {
      console.error('Error loading books:', error);
      return [];
    }
  }

  getBook(id: string): SavedBook | null {
    const books = this.getAllBooks();
    return books.find(b => b.id === id) || null;
  }

  deleteBook(id: string): void {
    const books = this.getAllBooks().filter(b => b.id !== id);
    localStorage.setItem(this.BOOKS_KEY, JSON.stringify(books));
    
    // Also delete related notes and audio
    this.deleteNotesByBook(id);
    this.deleteAudioByBook(id);
  }

  updateBookProgress(id: string, page: number): void {
    const books = this.getAllBooks();
    const book = books.find(b => b.id === id);
    if (book) {
      book.lastReadPage = page;
      localStorage.setItem(this.BOOKS_KEY, JSON.stringify(books));
    }
  }

  // Notes Management
  saveNote(note: Note): void {
    try {
      const notes = this.getAllNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = note;
      } else {
        notes.push(note);
      }
      
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving note:', error);
      throw new Error('Failed to save note. Storage may be full.');
    }
  }

  getAllNotes(): Note[] {
    try {
      const data = localStorage.getItem(this.NOTES_KEY);
      if (!data) return [];
      
      const notes = JSON.parse(data);
      return notes.map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  getNotesByBook(bookId: string): Note[] {
    return this.getAllNotes().filter(n => n.bookId === bookId);
  }

  deleteNote(id: string): void {
    const notes = this.getAllNotes().filter(n => n.id !== id);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  }

  deleteNotesByBook(bookId: string): void {
    const notes = this.getAllNotes().filter(n => n.bookId !== bookId);
    localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
  }

  // Audio Management (using IndexedDB for larger files)
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartReaderAudio', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('audio')) {
          db.createObjectStore('audio', { keyPath: 'id' });
        }
      };
    });
  }

  async saveAudio(audio: SavedAudio): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      
      await new Promise((resolve, reject) => {
        const request = store.put(audio);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
    } catch (error) {
      console.error('Error saving audio:', error);
      throw new Error('Failed to save audio file.');
    }
  }

  async getAllAudio(): Promise<SavedAudio[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['audio'], 'readonly');
      const store = transaction.objectStore('audio');
      
      const audio = await new Promise<SavedAudio[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
      
      return audio.map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
      }));
    } catch (error) {
      console.error('Error loading audio:', error);
      return [];
    }
  }

  async getAudioByBook(bookId: string): Promise<SavedAudio[]> {
    const allAudio = await this.getAllAudio();
    return allAudio.filter(a => a.bookId === bookId);
  }

  async deleteAudio(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['audio'], 'readwrite');
      const store = transaction.objectStore('audio');
      
      await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      db.close();
    } catch (error) {
      console.error('Error deleting audio:', error);
    }
  }

  async deleteAudioByBook(bookId: string): Promise<void> {
    const audio = await this.getAudioByBook(bookId);
    for (const a of audio) {
      await this.deleteAudio(a.id);
    }
  }

  // Storage Info
  getStorageInfo(): { used: number; max: number; percentage: number } {
    let used = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Convert to bytes (rough estimate)
    used = used * 2; // UTF-16 characters
    
    return {
      used,
      max: this.MAX_STORAGE,
      percentage: Math.round((used / this.MAX_STORAGE) * 100),
    };
  }

  // Clear all data
  clearAll(): void {
    localStorage.removeItem(this.BOOKS_KEY);
    localStorage.removeItem(this.NOTES_KEY);
    indexedDB.deleteDatabase('SmartReaderAudio');
  }

  // Export data
  exportData(): string {
    const data = {
      books: this.getAllBooks(),
      notes: this.getAllNotes(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  // Import data
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.books) {
        localStorage.setItem(this.BOOKS_KEY, JSON.stringify(data.books));
      }
      
      if (data.notes) {
        localStorage.setItem(this.NOTES_KEY, JSON.stringify(data.notes));
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid import data format.');
    }
  }

  // Google Drive sync methods
  async syncToGoogleDrive(): Promise<void> {
    if (!googleAuthService.isSignedIn()) {
      throw new Error('User must be signed in to sync with Google Drive');
    }

    try {
      await googleDriveService.initialize();
      
      // Sync books
      const books = this.getAllBooks();
      for (const book of books) {
        if (!book.googleDriveId) {
          try {
            const driveFile = await googleDriveService.saveBook(book);
            book.googleDriveId = driveFile.id;
            book.syncedAt = new Date();
            await this.saveBook(book);
          } catch (error) {
            console.error(`Failed to sync book ${book.title}:`, error);
          }
        }
      }

      // Sync notes
      const notes = this.getAllNotes();
      if (notes.length > 0) {
        try {
          const driveFile = await googleDriveService.saveNotes(notes);
          // Store the notes file ID in localStorage for reference
          localStorage.setItem('smart_reader_notes_drive_id', driveFile.id);
        } catch (error) {
          console.error('Failed to sync notes:', error);
        }
      }

      // Sync audio files
      const audio = await this.getAllAudio();
      for (const audioFile of audio) {
        if (!audioFile.googleDriveId) {
          try {
            const driveFile = await googleDriveService.saveAudio(audioFile.audioBlob, {
              title: audioFile.title,
              bookId: audioFile.bookId,
              pageRange: audioFile.pageRange,
              voiceName: audioFile.voiceName,
            });
            audioFile.googleDriveId = driveFile.id;
            audioFile.syncedAt = new Date();
            await this.saveAudio(audioFile);
          } catch (error) {
            console.error(`Failed to sync audio ${audioFile.title}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      throw new Error('Failed to sync with Google Drive');
    }
  }

  async syncFromGoogleDrive(): Promise<void> {
    if (!googleAuthService.isSignedIn()) {
      throw new Error('User must be signed in to sync from Google Drive');
    }

    try {
      await googleDriveService.initialize();
      
      // Get all files from Google Drive
      const driveFiles = await googleDriveService.listAppFiles();
      
      for (const file of driveFiles) {
        try {
          if (file.name.endsWith('.json') && file.name !== 'notes.json') {
            // This is a book file
            const bookData = await googleDriveService.loadBook(file.id);
            
            // Check if book already exists locally
            const existingBook = this.getBook(bookData.id);
            if (!existingBook) {
              // Add new book
              bookData.googleDriveId = file.id;
              bookData.syncedAt = new Date();
              await this.saveBook(bookData);
            }
          } else if (file.name === 'notes.json') {
            // This is the notes file
            const notesData = await googleDriveService.loadNotes(file.id);
            
            // Merge with existing notes (avoid duplicates)
            const existingNotes = this.getAllNotes();
            const existingIds = new Set(existingNotes.map(n => n.id));
            const newNotes = notesData.filter(n => !existingIds.has(n.id));
            
            for (const note of newNotes) {
              this.saveNote(note);
            }
          } else if (file.mimeType.startsWith('audio/')) {
            // This is an audio file
            const audioBlob = await googleDriveService.loadAudio(file.id);
            
            // Create audio object (we need to reconstruct metadata)
            const audioData: SavedAudio = {
              id: crypto.randomUUID(),
              bookId: 'unknown', // We'll need to store this in metadata
              title: file.name.replace('.wav', ''),
              audioBlob,
              duration: 0,
              pageRange: { start: 1, end: 1 },
              voiceName: 'Unknown',
              createdAt: file.createdTime,
              googleDriveId: file.id,
              syncedAt: new Date(),
            };
            
            await this.saveAudio(audioData);
          }
        } catch (error) {
          console.error(`Failed to sync file ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing from Google Drive:', error);
      throw new Error('Failed to sync from Google Drive');
    }
  }

  async isGoogleDriveEnabled(): Promise<boolean> {
    return googleAuthService.isSignedIn();
  }

  async getSyncStatus(): Promise<{ lastSync: Date | null; isEnabled: boolean }> {
    const isEnabled = await this.isGoogleDriveEnabled();
    const lastSync = localStorage.getItem('smart_reader_last_sync');
    
    return {
      isEnabled,
      lastSync: lastSync ? new Date(lastSync) : null,
    };
  }

  async setLastSyncTime(): Promise<void> {
    localStorage.setItem('smart_reader_last_sync', new Date().toISOString());
  }
}

export const storageService = new StorageService();
