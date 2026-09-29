export const buildVoiceResponse = ({ message, intent }) => ({
  spokenText: message || 'TripEase Assistant is ready to help you.',
  intent: intent || 'GENERAL_TRAVEL_QUERY',
  canSpeak: typeof window !== 'undefined' || typeof speechSynthesis !== 'undefined'
});
