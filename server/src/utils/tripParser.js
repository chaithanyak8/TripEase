import { findIndiaDestination } from '../../../shared/indiaTravelCatalog.js';

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/₹|rs\.|rs|rupees|inr/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const findDestinationByName = (searchText, destinations) => {
  const query = normalizeText(searchText || '');

  if (!query) {
    return null;
  }

  const catalogDestination = findIndiaDestination(searchText, destinations);
  if (catalogDestination) return catalogDestination;

  const byExactName = destinations.find(destination => {
    const name = normalizeText(destination.name);
    return query === name;
  });

  if (byExactName) {
    return byExactName;
  }

  if (query === 'goa') {
    return destinations.find(destination => destination.id === 'dest-south-goa') ||
      destinations.find(destination => normalizeText(destination.state) === query) || null;
  }

  const byState = destinations.find(destination => normalizeText(destination.state) === query);
  if (byState) {
    return byState;
  }

  const byToken = destinations.find(destination => {
    const tokens = new Set([
      ...(destination.name ? normalizeText(destination.name).split(' ') : []),
      ...(destination.state ? normalizeText(destination.state).split(' ') : []),
      ...(destination.tags || []),
      ...(destination.category ? normalizeText(destination.category).split(' ') : []),
      ...(destination.secondaryCategory ? normalizeText(destination.secondaryCategory).split(' ') : [])
    ].filter(Boolean));

    return [...tokens].some(token => query.includes(token));
  });

  return byToken || null;
};

const parseBudgetToken = (value) => {
  const cleaned = String(value || '')
    .replace(/[₹,\s]/g, '')
    .toLowerCase();

  if (!cleaned) return null;
  if (cleaned.endsWith('k')) {
    return Number(cleaned.slice(0, -1)) * 1000;
  }

  return Number(cleaned);
};

const extractBudgetValue = (text, fallback = 10000) => {
  const raw = String(text || '');
  const prefixedPatterns = [
    /(?:under|budget|upto|up\s*to|within|limit|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d+)?k?)/i,
    /(?:₹|rs\.?|inr)\s*(\d+(?:,\d{3})*(?:\.\d+)?k?)/i,
    /\b((?:\d{1,3}(?:,\d{3})+|\d{4,})(?:\.\d+)?k?)\b/i,
    /\b(\d+(?:\.\d+)?k)\b/i
  ];

  for (const pattern of prefixedPatterns) {
    const match = raw.match(pattern);
    if (match && match[1]) {
      const value = parseBudgetToken(match[1]);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return Number(fallback) || 10000;
};

const extractOrigin = (text, fallback = 'Bengaluru') => {
  const query = String(text || '');
  const patterns = [
    /from\s+([A-Za-z][A-Za-z0-9&() .-]+?)\s+(?:to|for|with)/i,
    /starting\s+from\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+to\s+|\s+for\s+|$)/i,
    /journey\s+from\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+to\s+|\s+for\s+|$)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }

  return fallback;
};

const extractDestinationText = (text, fallback = '') => {
  const query = String(text || '');
  const patterns = [
    /(?:visit|visiting|explore|exploring)\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+under\s+|\s+for\s+|\s+with\s+|\s+from\s+|$)/i,
    /to\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+under\s+|\s+for\s+|\s+with\s+|\s+from\s+|$)/i,
    /\bin\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+under\s+|\s+for\s+|\s+with\s+|\s+from\s+|$)/i,
    /destination\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+under\s+|\s+for\s+|\s+with\s+|$)/i,
    /travel\s+to\s+([A-Za-z][A-Za-z0-9&() .-]+?)(?:\s+under\s+|\s+for\s+|\s+with\s+|$)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }

  if (fallback && fallback.trim()) {
    return fallback.trim();
  }

  return '';
};

export const parseTripRequest = (request = {}, destinations = []) => {
  const requestText = [request.naturalLanguageQuery || '', request.destinationName || '', request.origin || ''].join(' ');
  const destinationText = [request.naturalLanguageQuery || '', request.destinationName || ''].join(' ');
  const destinationCandidate = extractDestinationText(destinationText, request.destinationName || '');
  const originCandidate = extractOrigin(requestText, request.origin || 'Bengaluru');
  const requestedDestinationName = (destinationCandidate || request.destinationName || '').trim();
  const destination = requestedDestinationName ? findDestinationByName(requestedDestinationName, destinations) : null;

  const normalizedQuery = normalizeText(requestText);
  const budget = (() => {
    const rawBudget = Number(request.budget ?? 10000);
    return extractBudgetValue(requestText, rawBudget);
  })();

  const travelers = (() => {
    const peopleMatch = String(normalizedQuery).match(/(\d+)\s*(?:people|persons?|travellers?|travelers|adults?)/i);
    if (peopleMatch) {
      return Number(peopleMatch[1]);
    }
    return Number(request.travelers || 2);
  })();

  const durationDays = (() => {
    const daysMatch = String(normalizedQuery).match(/(\d+)\s*(?:day|days)/i);
    const nightsMatch = String(normalizedQuery).match(/(\d+)\s*(?:night|nights)/i);
    if (daysMatch) {
      return Number(daysMatch[1]);
    }
    if (nightsMatch) {
      return Number(nightsMatch[1]);
    }
    return Number(request.durationDays || 3);
  })();

  const travelType = (() => {
    if (/beach|coastal|sea/.test(normalizedQuery)) return 'Beach & Relaxed';
    if (/adventure|trek|hike|kayak|sports/.test(normalizedQuery)) return 'Adventure & Water Sports';
    if (/heritage|culture|temple|history/.test(normalizedQuery)) return 'Heritage & Culture';
    if (/food|cuisine|tasting|local foodie/.test(normalizedQuery)) return 'Food & Heritage';
    return request.travelType || request.travelStyle || 'Relaxed & Balanced';
  })();

  const destinationName = requestedDestinationName || (destination && destination.name) || '';

  return {
    origin: originCandidate,
    destination,
    destinationName,
    durationDays,
    travelers,
    budget,
    travelType,
    travelStyle: travelType,
    interests: request.interests || [travelType],
    naturalLanguageQuery: request.naturalLanguageQuery || ''
  };
};
