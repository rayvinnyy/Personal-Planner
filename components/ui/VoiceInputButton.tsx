
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  simple?: boolean; // If true, smaller icon without background
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, className = '', simple = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const handleStartListening = () => {
    if (!isSupported) {
      alert("抱歉，您的浏览器不支持语音输入功能 (仅支持 Chrome/Edge/Safari)");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'zh-CN'; // Default to Chinese
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Remove trailing punctuation which some browsers add
      const cleanText = transcript.replace(/[。，,.?？!！]+$/, ''); 
      onTranscript(cleanText);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isSupported) return null;

  if (simple) {
      return (
        <button
            type="button"
            onClick={handleStartListening}
            className={`text-r-primary hover:text-r-primary-hover transition-colors ${isListening ? 'animate-pulse text-red-500' : ''} ${className}`}
            title="语音输入"
        >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )
  }

  return (
    <button
      type="button"
      onClick={handleStartListening}
      className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
        isListening 
          ? 'bg-red-100 text-red-500 animate-pulse shadow-inner' 
          : 'bg-white text-r-sub hover:bg-r-light hover:text-r-primary border border-transparent hover:border-r-border'
      } ${className}`}
      title="点击开始说话"
    >
      {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
    </button>
  );
};

export default VoiceInputButton;
