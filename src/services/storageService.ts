/**
 * Storage Service
 * Manages local storage for books, notes, and audio files
 */

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
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  pageNumber?: number;
  createdAt: Date;
  updatedAt: Date;
  selectedText?: string;
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
}

export const storageService = new StorageService();
