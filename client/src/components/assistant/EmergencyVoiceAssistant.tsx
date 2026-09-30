import React, { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { Mic, Volume2, VolumeX } from 'lucide-react';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export const EmergencyVoiceAssistant: React.FC = () => {
  const { selectedDestination, currentLocation } = useApp();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('How can I help you?');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      handleVoiceCommand(result);
    };

    recognition.onerror = (event: any) => {
      setError(event.error ? `Speech recognition error: ${event.error}` : 'Voice input is unavailable in this browser.');
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = async (message: string) => {
    setIsProcessing(true);
    try {
      const latitude = currentLocation?.latitude ?? selectedDestination?.coordinates.lat ?? 12.9716;
      const longitude = currentLocation?.longitude ?? selectedDestination?.coordinates.lng ?? 77.5946;
      const response = await fetch(apiUrl('/api/ai/voice-assistant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          latitude,
          longitude,
          destination: selectedDestination?.name || 'India',
          language: 'en',
          emergencyMode: /danger|emergency|help me|injured|attack/i.test(message)
        })
      });
      const data = await response.json();
      setTranscript(data.reply || 'TripEase Assistant: How can I help you?');
      if (data.reply) speakResponse(data.reply);
    } catch (error) {
      const fallback = 'TripEase Assistant: I can help with nearby services, weather, and safety guidance.';
      setTranscript(fallback);
      speakResponse(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported in this browser.');
      return;
    }
    setError('');
    setIsListening(true);
    setTranscript('Listening...');
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg">
          <Mic className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-900">TripEase Assistant</h3>
        <p className="text-sm text-slate-600">{transcript}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={startListening}
          disabled={isListening || isProcessing}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-60 cursor-pointer"
        >
          {isListening ? 'Listening...' : isProcessing ? 'Processing...' : '🎙 Start Speaking'}
        </button>
        <button
          onClick={stopListening}
          className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition cursor-pointer"
        >
          <VolumeX className="w-4 h-4 inline-block" /> Stop
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Volume2 className="w-4 h-4" />
        <span>Voice responses are spoken through your browser when permitted.</span>
      </div>
    </div>
  );
};
