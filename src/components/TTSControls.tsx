import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { ttsService } from '../services/ttsService';
import { 
  Volume2, VolumeX, Play, Pause, Square, Settings, 
  ChevronDown, FastForward, Rewind, User, Users
} from 'lucide-react';

export function TTSControls() {
  const { tts, updateTTS } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [femaleVoices, setFemaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [maleVoices, setMaleVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (ttsService.isSupported()) {
      const naturalVoices = ttsService.getNaturalVoices();
      setFemaleVoices(naturalVoices.female);
      setMaleVoices(naturalVoices.male);
      
      const currentSettings = ttsService.getSettings();
      if (currentSettings.voice) {
        setSelectedVoice(currentSettings.voice);
        updateTTS({ voiceName: currentSettings.voice.name });
      } else if (naturalVoices.female.length > 0) {
        // Auto-select first female voice as default
        const defaultVoice = naturalVoices.female[0];
        setSelectedVoice(defaultVoice);
        ttsService.setVoice(defaultVoice);
        updateTTS({ voiceName: defaultVoice.name });
      }
    }
  }, []);

  useEffect(() => {
    // Apply TTS settings when they change
    if (selectedVoice) {
      ttsService.setVoice(selectedVoice);
    }
    ttsService.setRate(tts.rate);
    ttsService.setPitch(tts.pitch);
    ttsService.setVolume(tts.volume);
  }, [tts.rate, tts.pitch, tts.volume, selectedVoice]);

  const handleVoiceChange = (voiceName: string) => {
    const allVoices = [...femaleVoices, ...maleVoices];
    const voice = allVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      ttsService.setVoice(voice);
      updateTTS({ voiceName: voice.name });
    }
  };

  const getVoiceLabel = (voice: SpeechSynthesisVoice): string => {
    // Simplify voice name for display
    let name = voice.name;
    
    // Remove common prefixes
    name = name.replace(/^(Google|Microsoft|Apple|Amazon)\s+/i, '');
    name = name.replace(/\s+(US|UK|GB|En)$/i, '');
    
    return name;
  };

  const previewVoice = (voice: SpeechSynthesisVoice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Stop any current speech
    ttsService.stop();
    
    // Temporarily use this voice for preview
    const currentVoice = selectedVoice;
    ttsService.setVoice(voice);
    
    // Speak a preview message
    const previewText = "Hello! This is how I sound when reading your documents.";
    ttsService.speak(previewText, () => {
      // Restore original voice after preview
      if (currentVoice) {
        ttsService.setVoice(currentVoice);
      }
    });
  };

  const handleRateChange = (value: number) => {
    updateTTS({ rate: value });
  };

  const handlePitchChange = (value: number) => {
    updateTTS({ pitch: value });
  };

  const handleVolumeChange = (value: number) => {
    updateTTS({ volume: value });
  };

  const handleSpeedPreset = (speed: number) => {
    updateTTS({ rate: speed });
  };

  if (!ttsService.isSupported()) {
    return (
      <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
        <VolumeX className="w-4 h-4" />
        <span>Text-to-Speech not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateTTS({ isEnabled: !tts.isEnabled })}
          className={`p-2 rounded-lg transition-colors ${
            tts.isEnabled
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title={tts.isEnabled ? 'Disable TTS' : 'Enable TTS'}
        >
          <Volume2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title="TTS Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Speed Presets */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => handleSpeedPreset(0.75)}
            className={`px-2 py-1 text-xs rounded ${
              tts.rate === 0.75
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            0.75x
          </button>
          <button
            onClick={() => handleSpeedPreset(1.0)}
            className={`px-2 py-1 text-xs rounded ${
              tts.rate === 1.0
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => handleSpeedPreset(1.25)}
            className={`px-2 py-1 text-xs rounded ${
              tts.rate === 1.25
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            1.25x
          </button>
          <button
            onClick={() => handleSpeedPreset(1.5)}
            className={`px-2 py-1 text-xs rounded ${
              tts.rate === 1.5
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            1.5x
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          {/* Voice Selection - Curated Natural Voices */}
          <div>
            <label className="block text-sm font-medium mb-3">Choose a Natural Voice</label>
            
            {/* Female Voices */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-pink-600 dark:text-pink-400">
                <User className="w-3 h-3" />
                <span>Female Voices</span>
              </div>
              <div className="grid gap-2">
                {femaleVoices.map((voice, index) => (
                  <div
                    key={voice.name}
                    className={`rounded-lg border-2 transition-all ${
                      selectedVoice?.name === voice.name
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-700 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => handleVoiceChange(voice.name)}
                        className="flex-1 px-4 py-2.5 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-medium ${selectedVoice?.name === voice.name ? 'text-pink-700 dark:text-pink-300' : ''}`}>
                              {getVoiceLabel(voice)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{voice.lang}</div>
                          </div>
                          {selectedVoice?.name === voice.name && (
                            <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => previewVoice(voice, e)}
                        className="px-3 py-2 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-r-lg transition-colors"
                        title="Preview voice"
                      >
                        <Play className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Male Voices */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Users className="w-3 h-3" />
                <span>Male Voices</span>
              </div>
              <div className="grid gap-2">
                {maleVoices.map((voice, index) => (
                  <div
                    key={voice.name}
                    className={`rounded-lg border-2 transition-all ${
                      selectedVoice?.name === voice.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => handleVoiceChange(voice.name)}
                        className="flex-1 px-4 py-2.5 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-medium ${selectedVoice?.name === voice.name ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                              {getVoiceLabel(voice)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{voice.lang}</div>
                          </div>
                          {selectedVoice?.name === voice.name && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => previewVoice(voice, e)}
                        className="px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-r-lg transition-colors"
                        title="Preview voice"
                      >
                        <Play className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Speed Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Speed: {tts.rate.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={tts.rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Pitch Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pitch: {tts.pitch.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={tts.pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Volume Slider */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Volume: {Math.round(tts.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={tts.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Highlight Current Word */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="highlight-word"
              checked={tts.highlightCurrentWord}
              onChange={(e) => updateTTS({ highlightCurrentWord: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="highlight-word" className="text-sm">
              Highlight current word while reading
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
