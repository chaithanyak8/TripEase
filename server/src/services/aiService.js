const emergencyKeywords = ['danger', 'emergency', 'injured', 'attack', 'help me', 'need emergency', 'call emergency', 'i am in danger'];
const intentMap = {
  'hospital': 'FIND_HOSPITAL',
  'police': 'FIND_POLICE',
  'pharmacy': 'FIND_PHARMACY',
  'ambulance': 'FIND_AMBULANCE',
  'fire': 'FIND_FIRE_STATION',
  'weather': 'WEATHER',
  'direction': 'GET_DIRECTIONS',
  'share location': 'SHARE_LOCATION',
  'travel help': 'TRAVEL_HELP',
  'safe place': 'FIND_SAFE_PLACE',
  'call emergency': 'CALL_EMERGENCY'
};

export const interpretVoiceMessage = ({ message, latitude, longitude, destination, language = 'en', emergencyMode = false }) => {
  const text = String(message || '').toLowerCase();
  const recognizedLanguage = /\b(kannada|hindi|english)\b/.test(text) ? text.includes('kannada') ? 'kn' : text.includes('hindi') ? 'hi' : 'en' : language;
  const isEmergency = emergencyMode || emergencyKeywords.some((keyword) => text.includes(keyword));

  let intent = 'GENERAL_TRAVEL_QUERY';
  if (isEmergency) intent = 'EMERGENCY';
  if (text.includes('hospital')) intent = 'FIND_HOSPITAL';
  if (text.includes('police')) intent = 'FIND_POLICE';
  if (text.includes('pharmacy') || text.includes('medicine')) intent = 'FIND_PHARMACY';
  if (text.includes('ambulance')) intent = 'FIND_AMBULANCE';
  if (text.includes('fire')) intent = 'FIND_FIRE_STATION';
  if (text.includes('weather')) intent = 'WEATHER';
  if (text.includes('direction') || text.includes('route')) intent = 'GET_DIRECTIONS';
  if (text.includes('share location') || text.includes('location')) intent = 'SHARE_LOCATION';
  if (text.includes('safe place') || text.includes('safe')) intent = 'FIND_SAFE_PLACE';
  if (text.includes('call emergency') || text.includes('112')) intent = 'CALL_EMERGENCY';

  const actions = [
    'SEARCH_NEARBY_HOSPITALS',
    'SHOW_MAP',
    'READ_RESPONSE'
  ];

  if (intent === 'FIND_HOSPITAL') actions[0] = 'SEARCH_NEARBY_HOSPITALS';
  if (intent === 'FIND_POLICE') actions[0] = 'SEARCH_NEARBY_POLICE';
  if (intent === 'FIND_PHARMACY') actions[0] = 'SEARCH_NEARBY_PHARMACY';
  if (intent === 'WEATHER') actions[0] = 'FETCH_WEATHER';
  if (intent === 'GET_DIRECTIONS') actions[0] = 'OPEN_DIRECTIONS';
  if (intent === 'CALL_EMERGENCY') actions.unshift('CALL_EMERGENCY_NUMBER');

  const reply = isEmergency
    ? 'I have switched to emergency mode. Your location is being used to find the nearest emergency help. Please confirm before any call.'
    : `I found the best nearby options for ${destination || 'your selected destination'} based on your current location.`;

  return {
    reply,
    intent,
    emergency: isEmergency,
    actions,
    language: recognizedLanguage,
    destination,
    latitude,
    longitude
  };
};
