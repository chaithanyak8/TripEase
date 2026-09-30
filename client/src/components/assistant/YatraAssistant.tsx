import React, { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import { Bot, Send, X, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestions?: string[];
}

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

const normalizeUserText = (value: string) => value.replace(/\s+/g, ' ').replace(/[\u00A0]/g, ' ').trim();

const buildLocalConversationReply = (input: string, previousAssistantText: string) => {
  const normalized = normalizeUserText(input).toLowerCase().replace(/[.!?,]+$/g, '');
  const previous = previousAssistantText.toLowerCase();
  if (/^(?:hi|hii+|hlo|hello|hey|hey there|hello assistant|hi tripease|hey tripease|are you there|are you there\?)$/.test(normalized)) {
    const reply = normalized === 'are you there'
      ? "Yes, I'm here! 😊 How can I help you?"
      : normalized === 'hi' || normalized.startsWith('hii')
        ? "Hi! 👋 I'm TripEase Assistant. How can I help you with your trip today?"
        : normalized === 'hlo'
          ? 'Hello! 👋 How can I help you plan your journey?'
      : normalized.startsWith('hey')
      ? 'Hey there! 😊 What can I help you with?'
        : 'Hello! 👋 How can I help you today?';
    return { reply, suggestions: ['Plan a trip', 'Suggest a destination', 'What can you do?'] };
  }
  if (/^(?:good morning|good afternoon|good evening)$/.test(normalized)) {
    const greeting = normalized.replace(/^good /, 'Good ');
    const symbol = normalized === 'good morning' ? '☀️' : '😊';
    return { reply: `${greeting}! ${symbol} Where would you like to explore today?`, suggestions: ['Suggest a destination', 'Plan a trip', 'What can you do?'] };
  }
  if (/^(?:how are you|how are you doing)$/.test(normalized)) {
    return { reply: "I'm doing great and ready to help you plan your next adventure! What can I do for you?", suggestions: ['Plan a trip', 'Suggest a destination', 'Explore local food'] };
  }
  if (/^(?:thank you|thanks|thank you so much|thanks a lot)$/.test(normalized)) {
    return { reply: "You're welcome! 😊 Happy to help.", suggestions: ['Plan a trip', 'Explore destinations'] };
  }
  if (/^(?:bye|goodbye|see you|see you later)$/.test(normalized)) {
    return { reply: 'Goodbye! Have a wonderful day and happy travels! ✈️', suggestions: [] };
  }
  if (/^(?:help|what can you do|how can you help me|what can you help me with)$/.test(normalized)) {
    return { reply: 'I can help you plan trips, discover destinations, find local food, explore hotels, manage your travel budget, and get travel safety information. What would you like to explore?', suggestions: ['Plan a trip', 'Suggest a destination', 'Check my budget'] };
  }
  if (/^(?:i want to travel|i want to go somewhere|i want a trip)$/.test(normalized)) {
    return { reply: "That sounds exciting! 😊 Where are you thinking of going?", suggestions: ['Suggest a destination', 'Plan a trip', 'Explore beaches'] };
  }
  if (/^(?:i don't know where to go|i do not know where to go|suggest a destination|where should i go)$/.test(normalized)) {
    return { reply: "No problem! Are you looking for beaches, mountains, nature, historical places, or a relaxing weekend getaway?", suggestions: ['Beaches', 'Mountains', 'Historical places'] };
  }
  if (/^(?:beaches|mountains|nature|historical places|a relaxing weekend|relaxing weekend getaway)$/.test(normalized) && /(?:what kind|looking for|enjoy)/.test(previous)) {
    const preference = normalized === 'a relaxing weekend' ? 'a relaxing weekend' : normalized;
    return { reply: `If you're looking for ${preference}, I can suggest destinations based on your budget and travel dates. What is your budget?`, suggestions: ['Suggest a destination', 'Plan a trip'] };
  }
  if (/^(?:suggest a destination|destination suggestion)$/.test(normalized)) {
    return { reply: 'Sure! Are you planning a weekend trip or a longer holiday? And what is your approximate budget?', suggestions: ['Weekend trip', 'Longer holiday'] };
  }
  if (/^(?:are you there)$/.test(normalized)) {
    return { reply: 'Yes, I\'m here! 😊 How can I help you?', suggestions: ['Plan a trip', 'What can you do?'] };
  }
  return null;
};

const formatMoney = (amount: number) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;

const toSentenceCase = (text: string) => {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const buildSpeechText = (text: string) => {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  if (cleaned.length <= 220) return cleaned;

  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    return sentences.slice(0, 2).join(' ').trim();
  }

  return cleaned.slice(0, 220).trim();
};

const safeEvaluateExpression = (expression: string): number | null => {
  const cleaned = expression
    .replace(/₹/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/inr/gi, '')
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/£/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!cleaned || !/^[0-9+\-*/().%\s]+$/.test(cleaned)) return null;

  const tokens = cleaned.match(/\d*\.?\d+|[()+\-*/%]/g) || [];
  if (!tokens.length) return null;

  let pointer = 0;
  const peek = () => tokens[pointer];
  const consume = () => tokens[pointer++];

  const parsePrimary = (): number => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');
    if (token === '(') {
      consume();
      const value = parseAddSubtract();
      if (consume() !== ')') throw new Error('Missing closing parenthesis');
      return value;
    }
    if (token === '+' || token === '-') {
      const sign = consume();
      return (sign === '-' ? -1 : 1) * parsePrimary();
    }
    if (!/^\d*\.?\d+$/.test(token)) throw new Error(`Unsupported token: ${token}`);
    consume();
    return Number(token);
  };

  const parseMultiplicative = (): number => {
    let total = parsePrimary();
    while (['*', '/', '%'].includes(peek() || '')) {
      const op = consume();
      const right = parsePrimary();
      if (op === '*') total *= right;
      if (op === '/') total /= right;
      if (op === '%') total %= right;
    }
    return total;
  };

  const parseAddSubtract = (): number => {
    let total = parseMultiplicative();
    while (['+', '-'].includes(peek() || '')) {
      const op = consume();
      const right = parseMultiplicative();
      if (op === '+') total += right;
      if (op === '-') total -= right;
    }
    return total;
  };

  try {
    const result = parseAddSubtract();
    if (pointer !== tokens.length) return null;
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

const extractCurrencyValue = (text: string): number | null => {
  const matches = [
    ...text.matchAll(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/gi),
    ...text.matchAll(/(?:\$|€|£)\s*([\d,]+(?:\.\d+)?)/g),
    ...text.matchAll(/(?:\b\d[\d,]*(?:\.\d+)?\s*(?:rupees?|inr)\b)/gi)
  ];

  for (const match of matches) {
    const value = (match[1] || match[0]).replace(/,/g, '');
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }

  return null;
};

const extractDurationValue = (text: string): number | null => {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(?:day|days|night|nights)\b/i);
  return match ? Number(match[1]) : null;
};

const extractTravelersValue = (text: string): number | null => {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(?:friends|traveler|travellers|travelers|people|guests|companions)\b/i);
  return match ? Number(match[1]) : null;
};

const buildLocalNumericReply = (input: string, trip: any, previousAssistantText = '') => {
  const text = normalizeUserText(input);
  if (!text) return null;

  const lower = text.toLowerCase();
  const calculation = safeEvaluateExpression(text);
  if (calculation !== null && /[+\-*/%]/.test(text.replace(/₹|rs\.?|inr|\$|€|£|\s+/gi, ''))) {
    const expression = text.replace(/\s+/g, ' ').trim();
    const formatted = expression.replace(/\s*([+\-*/%])\s*/g, ' $1 ');
    const result = formatMoney(Math.round(calculation));
    return {
      shouldUseLocal: true,
      reply: `${formatted} = ${result}`,
      suggestions: ['Track this as a budget', 'Check trip spending', 'View trip details']
    };
  }

  const standaloneNumber = text.match(/^\d[\d,]*(?:\.\d+)?$/);
  if (standaloneNumber) {
    const value = Number(text.replace(/,/g, ''));
    if (/budget/.test(previousAssistantText.toLowerCase())) {
      return {
        shouldUseLocal: true,
        reply: `Got it! I'll use ${formatMoney(value)} as your budget. How many days are you planning to travel?`,
        suggestions: ['3 days', '5 days', 'Plan my trip']
      };
    }
    return {
      shouldUseLocal: true,
      reply: `I received the number ${new Intl.NumberFormat('en-IN').format(value)}. What would you like it to represent — budget, distance, number of travelers, booking/reference number, or something else?`,
      suggestions: ['Use as trip budget', 'Use as travelers count', 'Check the itinerary']
    };
  }

  const currencyValue = extractCurrencyValue(text);
  if (currencyValue !== null) {
    const budgetSignal = /(budget|cost|money|spent|expense|fare|price|have|for this trip|this trip|trip budget)/i.test(lower);
    if (budgetSignal || /₹|rs\.?|inr|\$|€|£/.test(text)) {
      const tripBudget = trip?.totalBudget ?? 0;
      const remaining = trip ? Math.max(0, tripBudget - (trip.spent || 0)) : null;
      const budgetText = trip
        ? `Your current trip budget is ${formatMoney(tripBudget)} and ${remaining !== null ? `${formatMoney(remaining)} remains` : 'there is remaining budget available'}.`
        : 'I can treat this as a trip budget value. Tell me how you want to use it.';
      return {
        shouldUseLocal: true,
        reply: `I recognized ${formatMoney(currencyValue)} as a currency amount. ${budgetText}`,
        suggestions: ['Track this as my budget', 'Compare with trip spending', 'Plan the next day']
      };
    }
  }

  if (/(we are|there are|traveling with|travelling with|group of|friends|travelers|people|guests|companions)/i.test(lower)) {
    const travelerCount = extractTravelersValue(text);
    if (travelerCount !== null) {
      return {
        shouldUseLocal: true,
        reply: `I understood that there are ${travelerCount} travelers in your group. I’ll use that as the trip count for planning and room requirements.`,
        suggestions: ['Check hotel options', 'Adjust the itinerary', 'Review the trip budget']
      };
    }
  }

  if (/(\bday\b|\bdays\b|duration|trip length|length of trip)/i.test(lower)) {
    const duration = extractDurationValue(text);
    if (duration !== null) {
      return {
        shouldUseLocal: true,
        reply: `I understood that your trip duration is ${duration} ${duration === 1 ? 'day' : 'days'}.`,
        suggestions: ['View the day plan', 'Check the trip budget', 'Adjust travel dates']
      };
    }
  }

  const dayMatch = text.match(/\bday\s*#?\s*(\d+)\b/i);
  if (dayMatch && trip?.days?.length) {
    const dayIndex = Number(dayMatch[1]);
    const dayPlan = trip.days[dayIndex - 1];
    if (dayPlan) {
      return {
        shouldUseLocal: true,
        reply: `${trip.destination || 'Your trip'}, Day ${dayIndex}: Morning - ${dayPlan.morning?.activity || 'Explore the highlights'}, Afternoon - ${dayPlan.afternoon?.activity || 'Enjoy local experiences'}, Evening - ${dayPlan.evening?.activity || 'Take a relaxed evening walk'}.`,
        suggestions: ['Find local food', 'Check weather', 'View safety notes']
      };
    }
  }

  if (/(\d+\s*\+\s*\d+|\d+\s*-\s*\d+|\d+\s*\*\s*\d+|\d+\s*\/\s*\d+)/.test(text)) {
    const calcResult = safeEvaluateExpression(text);
    if (calcResult !== null) {
      return {
        shouldUseLocal: true,
        reply: `${toSentenceCase(text)} = ${formatMoney(Math.round(calcResult))}`,
        suggestions: ['Use this as my budget', 'Review the trip expenses', 'Check itinerary']
      };
    }
  }

  return null;
};

export const YatraAssistant: React.FC = () => {
  const { isChatOpen, setIsChatOpen, activeTrip, selectedDestination, currentLocation, setIsSOSModalOpen, setActiveTab, language } = useApp();
  const isVoiceDebugEnabled = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('voiceDebug') === 'true';
  const getRecognitionLanguage = () => {
    if (language === 'hi') return 'hi-IN';
    if (language === 'kn') return 'kn-IN';
    return 'en-IN';
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: "Namaste! I'm Yatra Assistant, your personalized AI travel companion. I'm actively monitoring your trip, weather, and budget. How can I help you today?",
      time: 'Just now',
      suggestions: [
        "Where should I go tomorrow?",
        "Find a cheap restaurant near me",
        "What should I do on Day 2?",
        "How much money have I spent?",
        "What should I pack?",
        "What are the local customs?",
        "Show nearby emergency services"
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceDiagnostics, setVoiceDiagnostics] = useState({
    support: 'unknown',
    permission: 'unknown',
    language: getRecognitionLanguage(),
    listening: false,
    lastError: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const handleSendMessageRef = useRef<(message?: string) => Promise<void>>(async () => {});
  const voiceSubmissionRef = useRef(false);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    setMessages([{
      id: `welcome-${activeTrip?.id || 'none'}`,
      sender: 'assistant',
      text: activeTrip
        ? `Your active trip is ${activeTrip.destination}, ${activeTrip.durationDays} days for ${activeTrip.travelers} travelers. I can help with its itinerary, local food, safety, and budget.`
        : 'Namaste! 👋 I can help you plan trips, discover destinations, and explore travel options. What can I help you with?',
      time: 'Just now',
      suggestions: [
        'What should I do on Day 2?',
        'Find local food for this trip',
        'How much budget remains?',
        'What are the local safety notes?',
        'Show nearby emergency services'
      ]
    }]);
  }, [activeTrip?.id]);

  useEffect(() => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceDiagnostics(prev => ({ ...prev, support: 'NO', permission: 'unknown', listening: false, lastError: 'missing_api' }));
      if (isVoiceDebugEnabled) {
        console.log('[Voice] SpeechRecognition:', SpeechRecognitionCtor);
        console.log('[Voice] Speech recognition supported:', !!SpeechRecognitionCtor);
      }
      return;
    }

    if (isVoiceDebugEnabled) {
      console.log('[Voice] SpeechRecognition:', SpeechRecognitionCtor);
      console.log('[Voice] Speech recognition supported:', !!SpeechRecognitionCtor);
    }

    setVoiceDiagnostics(prev => ({ ...prev, support: 'YES' }));

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = getRecognitionLanguage();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceDiagnostics(prev => ({ ...prev, listening: true, lastError: '' }));
      if (isVoiceDebugEnabled) console.log('[Voice] Recognition started');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const candidate = result[0]?.transcript || '';
        if (result.isFinal) {
          transcript += candidate;
        } else if (candidate) {
          setInputText(candidate.trim());
        }
      }

      transcript = transcript.trim();
      if (transcript && !voiceSubmissionRef.current) {
        voiceSubmissionRef.current = true;
        setInputText(transcript);
        setVoiceError('');
        setIsListening(false);
        setVoiceDiagnostics(prev => ({ ...prev, listening: false, lastError: '' }));
        recognition.stop();
        if (isVoiceDebugEnabled) console.log('[Voice] Final transcript:', transcript);
        void handleSendMessageRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      const error = event?.error || 'unknown';
      const messageMap: Record<string, string> = {
        'not-allowed': 'Microphone permission is blocked. Please allow microphone access for TripEase in your browser settings and try again.',
        'audio-capture': 'No microphone was detected. Please check that your microphone is connected and available.',
        'no-speech': "I didn't hear anything. Please try again.",
        'network': 'Speech recognition needs an internet connection. Please check your connection and try again.',
        'aborted': 'Voice input was interrupted. Please try again.',
        'language-not-supported': 'The selected language is not supported on this device. Please try again in English.',
        'service-not-allowed': 'Speech recognition is blocked by the browser. Please check your microphone permission and try again.',
        'no-microphone': 'No microphone was detected. Please check that your microphone is connected and available.',
        'unknown': 'Voice input couldn’t start. Please try again.'
      };

      setIsListening(false);
      setVoiceDiagnostics(prev => ({ ...prev, listening: false, lastError: error }));
      if (isVoiceDebugEnabled) {
        console.error('[Voice] Speech recognition error:', error);
        console.error('[Voice] Speech recognition message:', event?.message || '');
      }
      setVoiceError(messageMap[error] || messageMap.unknown);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceDiagnostics(prev => ({ ...prev, listening: false }));
      if (isVoiceDebugEnabled) console.log('[Voice] Recognition ended');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [isVoiceDebugEnabled, language]);

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceError('Speech synthesis is not supported in this browser.');
      return;
    }

    const speechText = buildSpeechText(text);
    if (!speechText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = getRecognitionLanguage();
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError("Voice input isn't supported by this browser. Please use a supported browser such as Chrome.");
      setVoiceDiagnostics(prev => ({ ...prev, support: 'NO', lastError: 'missing_api' }));
      return;
    }

    if (isListening || !recognitionRef.current) {
      if (isListening) return;
      setVoiceError('Voice input is not ready yet. Please try again in a moment.');
      return;
    }

    if (isVoiceDebugEnabled) {
      console.log('[Voice] Button clicked');
      console.log('[Voice] Recognition created');
      console.log('[Voice] Starting recognition');
    }

    stopSpeaking();
    setVoiceError('');

    try {
      voiceSubmissionRef.current = false;
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
          setVoiceDiagnostics(prev => ({ ...prev, permission: status.state || 'unknown' }));
        }).catch(() => {
          setVoiceDiagnostics(prev => ({ ...prev, permission: 'unknown' }));
        });
      }
      recognitionRef.current.lang = getRecognitionLanguage();
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceDiagnostics(prev => ({ ...prev, listening: true, language: getRecognitionLanguage() }));
      if (isVoiceDebugEnabled) console.log('[Voice] Recognition started');
    } catch (error) {
      setIsListening(false);
      setVoiceDiagnostics(prev => ({ ...prev, listening: false, lastError: 'invalid_state' }));
      if (isVoiceDebugEnabled) console.error('[Voice] Failed to start recognition:', error);
      setVoiceError('Voice input couldn’t start. Please try again.');
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setVoiceDiagnostics(prev => ({ ...prev, listening: false }));
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = normalizeUserText(customMessage || inputText);
    if (!textToSend) return;

    const previousAssistantText = [...messages].reverse().find(message => message.sender === 'assistant')?.text || '';
    const conversationReply = buildLocalConversationReply(textToSend, previousAssistantText);
    const localReply = buildLocalNumericReply(textToSend, activeTrip, previousAssistantText);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInputText('');

    if (conversationReply) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: conversationReply.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: conversationReply.suggestions
      };
      setMessages(prev => [...prev, aiMsg]);
      speakResponse(conversationReply.reply);
      return;
    }

    if (localReply?.shouldUseLocal) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: localReply.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: localReply.suggestions
      };
      setMessages(prev => [...prev, aiMsg]);
      speakResponse(localReply.reply);
      return;
    }

    try {
      setIsTyping(true);
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          tripContext: activeTrip,
          destinationContext: selectedDestination,
          currentLocation,
          conversationHistory: messages.slice(-8).map(({ sender, text }) => ({ sender, text }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          time: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: data.suggestions
        };
        setMessages(prev => [...prev, aiMsg]);
        speakResponse(data.reply);
      } else {
        throw new Error('API response not ok');
      }
    } catch (err) {
      const budget = activeTrip?.totalBudget ?? 0;
      const spent = activeTrip?.spent ?? 0;
      const fallbackReply = activeTrip && /(budget|spent|money|cost)/i.test(textToSend)
        ? `${activeTrip.destination} trip budget: ₹${budget.toLocaleString()} total, ₹${spent.toLocaleString()} spent, ₹${Math.max(0, budget - spent).toLocaleString()} remaining.`
        : "I can help with that! Could you tell me a little more about what you need?";

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Check weather forecast', 'View day plan', 'Open Safety SOS']
        }
      ]);
      speakResponse(fallbackReply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (sug: string) => {
    if (sug.toLowerCase().includes('emergency') || sug.toLowerCase().includes('sos')) {
      setIsSOSModalOpen(true);
      return;
    }
    if (sug.toLowerCase().includes('map')) {
      setActiveTab('map');
      return;
    }
    if (sug.toLowerCase().includes('food') || sug.toLowerCase().includes('taste local')) {
      setActiveTab('food');
      return;
    }
    handleSendMessage(sug);
  };

  handleSendMessageRef.current = handleSendMessage;

  const voiceStatus = isListening ? 'Listening...' : isTyping ? 'Processing...' : isSpeaking ? 'Speaking...' : voiceError ? 'Error' : 'Ready';

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-40 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/30"
        title="Chat with Assistant"
        aria-label="Open AI Chat"
      >
        <div className="relative">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white animate-pulse" />
        </div>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden sm:inline">
          🎙️ Talk to TripEase
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] max-h-[85vh] animate-slideUp">
      <div className="bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-700 text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-sm">Assistant</h3>
              <span className="bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                AI ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-sky-100">
              Aware of: {activeTrip?.destination || 'No active trip'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              aria-label="Stop speech output"
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
              }`}
            >
              {msg.text}
            </div>
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-[9px] text-slate-400">{msg.time}</span>
              {msg.sender === 'assistant' && (
                <button
                  type="button"
                  onClick={() => speakResponse(msg.text)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 transition cursor-pointer"
                  aria-label="Replay assistant response"
                  title="Replay response"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                {msg.suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-[10px] font-medium bg-white hover:bg-sky-50 border border-sky-200 text-sky-800 px-2.5 py-1 rounded-full transition cursor-pointer shadow-2xs hover:border-sky-300"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl px-3 py-2 w-20">
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-3 py-2">
        {voiceError && (
          <p className="mb-2 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">{voiceError}</p>
        )}
        <p className="mb-1 px-1 text-[10px] text-slate-500" role="status" aria-live="polite">Voice assistant: {voiceStatus}</p>

        {isVoiceDebugEnabled && (
          <div className="mb-2 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[9px] text-slate-700">
            <div>Voice Support: {voiceDiagnostics.support}</div>
            <div>SpeechRecognition: {voiceDiagnostics.support === 'YES' ? 'YES' : 'NO'}</div>
            <div>webkitSpeechRecognition: {(window as any).webkitSpeechRecognition ? 'YES' : 'NO'}</div>
            <div>Microphone Permission: {voiceDiagnostics.permission}</div>
            <div>Language: {voiceDiagnostics.language}</div>
            <div>Listening: {voiceDiagnostics.listening ? 'YES' : 'NO'}</div>
            <div>Last Error: {voiceDiagnostics.lastError || 'none'}</div>
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${isListening ? 'bg-rose-500 text-white border-rose-500 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Ask anything about your trip...'}
            className="flex-1 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-sky-500 outline-none transition"
            aria-label="Assistant message input"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white transition cursor-pointer shrink-0 shadow-md shadow-sky-500/20"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
