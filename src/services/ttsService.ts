/**
 * Text-to-Speech Service
 * Provides natural human voice reading for PDF documents
 */

export interface Voice {
  name: string;
  lang: string;
  gender: 'male' | 'female';
  voiceURI: string;
}

export interface TTSSettings {
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  voice: SpeechSynthesisVoice | null;
}

class TextToSpeechService {
  private synth: SpeechSynthesis;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private settings: TTSSettings = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null,
  };
  private isPaused = false;
  private currentText = '';
  private onEndCallback: (() => void) | null = null;
  private onWordCallback: ((word: string, charIndex: number) => void) | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Load voices when they change (some browsers load them asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
    
    // Auto-select a high-quality English voice if available
    if (!this.settings.voice && this.voices.length > 0) {
      // Prefer premium/enhanced voices
      const premiumVoice = this.voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Natural'))
      );
      
      // Or use any English voice
      const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
      
      this.settings.voice = premiumVoice || englishVoice || this.voices[0];
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  setVoice(voice: SpeechSynthesisVoice) {
    this.settings.voice = voice;
  }

  setRate(rate: number) {
    this.settings.rate = Math.max(0.1, Math.min(10, rate));
    if (this.utterance && this.synth.speaking) {
      // Apply to current utterance
      this.utterance.rate = this.settings.rate;
    }
  }

  setPitch(pitch: number) {
    this.settings.pitch = Math.max(0, Math.min(2, pitch));
    if (this.utterance && this.synth.speaking) {
      this.utterance.pitch = this.settings.pitch;
    }
  }

  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    if (this.utterance && this.synth.speaking) {
      this.utterance.volume = this.settings.volume;
    }
  }

  speak(text: string, onEnd?: () => void, onWord?: (word: string, charIndex: number) => void) {
    // Cancel any ongoing speech
    this.stop();

    this.currentText = text;
    this.onEndCallback = onEnd || null;
    this.onWordCallback = onWord || null;

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.voice = this.settings.voice;
    this.utterance.rate = this.settings.rate;
    this.utterance.pitch = this.settings.pitch;
    this.utterance.volume = this.settings.volume;

    // Event listeners
    this.utterance.onend = () => {
      this.isPaused = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.isPaused = false;
    };

    if (this.onWordCallback) {
      this.utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const word = text.slice(event.charIndex, event.charIndex + event.charLength);
          this.onWordCallback!(word, event.charIndex);
        }
      };
    }

    this.synth.speak(this.utterance);
    this.isPaused = false;
  }

  pause() {
    if (this.synth.speaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stop() {
    this.synth.cancel();
    this.isPaused = false;
    this.utterance = null;
  }

  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  // Clean text for better TTS pronunciation
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Add space after punctuation
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .replace(/\s+([.!?,;:])/g, '$1') // Remove space before punctuation
      .trim();
  }

  // Split long text into sentences for better control
  splitIntoSentences(text: string): string[] {
    const cleaned = this.cleanText(text);
    return cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
  }
}

// Export singleton instance
export const ttsService = new TextToSpeechService();
