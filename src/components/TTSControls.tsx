import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { ttsService } from '../services/ttsService';
import { 
  Volume2, VolumeX, Play, Pause, Square, Settings, 
  ChevronDown, FastForward, Rewind 
} from 'lucide-react';

export function TTSControls() {
  const { tts, updateTTS } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (ttsService.isSupported()) {
      const availableVoices = ttsService.getEnglishVoices();
      setVoices(availableVoices);
      
      const currentSettings = ttsService.getSettings();
      if (currentSettings.voice) {
        setSelectedVoice(currentSettings.voice);
        updateTTS({ voiceName: currentSettings.voice.name });
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
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
      ttsService.setVoice(voice);
      updateTTS({ voiceName: voice.name });
    }
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
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <div className="relative">
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none pr-8"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
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
