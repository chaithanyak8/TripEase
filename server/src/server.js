// TripEase / YATRA360 - SIH 2026 Student Innovation Backend Server
// Problem Statement ID: 26204 | Theme: Travel & Tourism | AICTE & MIC

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  destinations,
  hotels,
  experiences,
  guides,
  transportOptions,
  regionalFoods,
  emergencySafetyDirectory,
  weatherForecasts,
  verifiedReviews,
  demoJudgePackage
} from './data/indianTourismData.js';
import { parseTripRequest } from './utils/tripParser.js';
import { defaultDestination, buildDestinationSearchResults, findDestinationByQuery } from './services/destinationService.js';
import { getPlacesNearLocation, searchPlaces } from './services/placesService.js';
import { buildMapMarkers } from './services/mapsService.js';
import { getNearbyEmergencyServices } from './services/emergencyService.js';
import { getWeatherForLocation } from './services/weatherService.js';
import { interpretVoiceMessage } from './services/aiService.js';
import {
  buildIndiaAttractions,
  buildIndiaDestinationCatalog,
  buildIndiaListingRecords,
  buildIndiaTransportOptions,
  findIndiaDestination,
  normalizeIndiaPlace
} from '../../shared/indiaTravelCatalog.js';

dotenv.config();

const indiaDestinationCatalog = buildIndiaDestinationCatalog();
for (const destination of indiaDestinationCatalog) {
  const normalizedName = normalizeIndiaPlace(destination.name);
  const existing = destinations.some(item => {
    const existingName = normalizeIndiaPlace(item.name);
    return existingName === normalizedName || existingName.includes(normalizedName) || normalizedName.includes(existingName);
  });
  if (!existing) destinations.push(destination);
}

const indiaAttractions = buildIndiaAttractions(indiaDestinationCatalog);
for (const destination of indiaDestinationCatalog) {
  const sampleData = buildIndiaListingRecords(destination);
  const addMissing = (current, generated, getName) => {
    const destinationKey = normalizeIndiaPlace(destination.name);
    const count = current.filter(item => {
      const itemDestination = normalizeIndiaPlace(getName(item));
      return item.destinationId === destination.id || itemDestination === destinationKey || itemDestination.includes(destinationKey);
    }).length;
    if (count < 3) current.push(...generated.slice(0, 3 - count));
  };
  addMissing(hotels, sampleData.hotels, item => item.destinationName || item.destination);
  addMissing(experiences, sampleData.experiences, item => item.destinationName || item.destinationId);
  addMissing(regionalFoods, sampleData.foods, item => item.destination);
  addMissing(guides, sampleData.guides, item => item.destinationName);
}

const normalizeDestination = value => {
  return normalizeIndiaPlace(value);
};

const getDestinationRecords = (destinationId, destinationName) => {
  const name = String(destinationName || '').trim();
  const normalizedName = normalizeDestination(name);

  if (normalizedName && destinations.some(item => normalizeDestination(item.state) === normalizedName)) {
    return destinations.filter(item => normalizeDestination(item.state) === normalizedName);
  }

  const selected = destinations.find(item => item.id === destinationId) ||
    destinations.find(item => normalizeDestination(item.name) === normalizedName) ||
    destinations.find(item => normalizeDestination(item.name).includes(normalizedName) && normalizedName.length > 2);

  if (selected) return [selected];
  return [];
};

const matchesDestination = (record, destinationRecords, destinationName) => {
  const recordId = record.destinationId;
  const recordName = normalizeDestination(record.destinationName || record.destination || '');
  const destination = normalizeDestination(destinationName);
  return destinationRecords.some(item => item.id === recordId ||
    recordName === normalizeDestination(item.name) ||
    (destination && recordName.includes(destination)));
};

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json());

const getLocationCoordinates = (req) => {
  const lat = Number(req.query.latitude ?? req.query.lat ?? req.body?.latitude ?? req.body?.lat);
  const lon = Number(req.query.longitude ?? req.query.lon ?? req.body?.longitude ?? req.body?.lon);
  return { latitude: Number.isFinite(lat) ? lat : defaultDestination.latitude, longitude: Number.isFinite(lon) ? lon : defaultDestination.longitude };
};

// In-memory state for bookings, reviews, and businesses created during demo session
let activeBookings = [
  {
    id: "BK-8841",
    itemType: "Hotel",
    title: "Paradise Isle Beach Resort & Homestay",
    destination: "Udupi & Coastal Karnataka",
    checkIn: "2026-10-15",
    checkOut: "2026-10-18",
    guests: 2,
    amount: 4800,
    status: "Confirmed",
    qrCode: "TE-HOTEL-BK-8841-CONFIRMED"
  },
  {
    id: "BK-9921",
    itemType: "Transport",
    title: "KSRTC Airavat Multi-Axle (Bengaluru -> Udupi)",
    destination: "Udupi",
    date: "2026-10-14",
    guests: 2,
    amount: 1700,
    status: "Confirmed",
    qrCode: "TE-TR-KSRTC-9921"
  },
  {
    id: "BK-4412",
    itemType: "Experience",
    title: "Suvarna River Backwater & Delta Kayaking",
    destination: "Udupi & Coastal Karnataka",
    date: "2026-10-16",
    guests: 2,
    amount: 1300,
    status: "Confirmed",
    qrCode: "TE-EXP-KAYAK-4412"
  }
];

let businessListings = [
  {
    id: "biz-1",
    businessName: "Kishkindha Crafts & Banana Fiber Weaving",
    type: "Handicrafts & Village Experience",
    ownerName: "Radha Devi",
    location: "Anegundi, Karnataka",
    phone: "+91 94481 22334",
    status: "Verified (Govt. MSME)",
    revenue: 48500,
    bookingsCount: 64,
    rating: 5.0
  },
  {
    id: "biz-2",
    businessName: "Suvarna Delta Eco Kayaking",
    type: "Adventure & Water Sports",
    ownerName: "Captain Ganesh",
    location: "Kodi Bengre, Udupi",
    phone: "+91 98455 33445",
    status: "Verified (Tourism Board)",
    revenue: 72000,
    bookingsCount: 95,
    rating: 4.9
  },
  {
    id: "biz-3",
    businessName: "Paradise Isle Coastal Homestay",
    type: "Hotel & Homestay",
    ownerName: "Sudarshan Shetty",
    location: "Malpe, Udupi",
    phone: "+91 94488 55667",
    status: "Verified (Homestay Guild)",
    revenue: 165000,
    bookingsCount: 88,
    rating: 4.8
  }
];

let localInquiries = [
  { id: "inq-1", from: "Pooja H.", message: "Is vegetarian Satvik breakfast included with the stay?", status: "Answered", date: "Today" },
  { id: "inq-2", from: "Vikram S.", message: "Can we rent two kayaks at 8 AM this Saturday?", status: "Pending", date: "Yesterday" }
];

// --- 1. HEALTH & SIH METADATA ---
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    service: "TripEase (YATRA360) Tourism Super-Platform API",
    sihContext: {
      problemStatementId: "26204",
      organization: "AICTE",
      department: "AICTE, MIC – Student Innovation",
      category: "Software",
      theme: "Travel & Tourism",
      tagline: "Your Journey. One Platform."
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/destinations/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  const query = normalizeIndiaPlace(q);
  const results = destinations.filter(destination => {
    const searchable = [destination.name, destination.state, destination.description, destination.shortDescription, ...(destination.categories || []), ...(destination.tags || []), ...(destination.attractions || []), ...(destination.popularActivities || [])].join(' ');
    return !query || normalizeIndiaPlace(searchable).includes(query) || normalizeIndiaPlace(destination.name).includes(query);
  }).slice(0, 40);
  res.json({
    total: results.length,
    query: q,
    destinations: results,
    source: q ? 'search' : 'default'
  });
});

app.get('/api/attractions', (req, res) => {
  const { category, state, destination, crowdLevel, beyondTheCrowd, search = '' } = req.query;
  const query = normalizeIndiaPlace(search);
  const selectedDestination = destination ? normalizeIndiaPlace(destination) : '';
  const results = indiaAttractions.filter(attraction => {
    if (category && category !== 'All' && attraction.category.toLowerCase() !== String(category).toLowerCase()) return false;
    if (state && state !== 'All' && attraction.state.toLowerCase() !== String(state).toLowerCase()) return false;
    if (selectedDestination && !normalizeIndiaPlace(attraction.destination).includes(selectedDestination) && !selectedDestination.includes(normalizeIndiaPlace(attraction.destination))) return false;
    if (crowdLevel && crowdLevel !== 'All' && attraction.crowdLevel !== crowdLevel) return false;
    if (beyondTheCrowd === 'true' && !attraction.beyondTheCrowd) return false;
    if (query) {
      const content = normalizeIndiaPlace([attraction.name, attraction.destination, attraction.city, attraction.state, attraction.category, attraction.description].join(' '));
      if (!content.includes(query)) return false;
    }
    return true;
  });
  res.json({
    total: results.length,
    attractions: results,
    states: [...new Set(indiaAttractions.map(item => item.state))].sort(),
    destinations: [...new Set(indiaAttractions.map(item => item.destination))].sort(),
    categories: [...new Set(indiaAttractions.map(item => item.category))].sort(),
    source: 'TripEase destination catalog'
  });
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  const query = normalizeIndiaPlace(q);
  if (!query) return res.json({ query: q, total: 0, results: [] });

  const contains = value => normalizeIndiaPlace(value).includes(query);
  const results = [];
  const addResults = (type, items, nameOf, destinationOf, descriptionOf, imageOf) => {
    for (const item of items) {
      if (results.filter(result => result.type === type).length >= 6) break;
      const name = nameOf(item);
      const destinationName = destinationOf(item);
      const content = [name, destinationName, item.state, item.city, item.description, item.category, item.type, ...(item.categories || []), ...(item.tags || [])].join(' ');
      if (!contains(content)) continue;
      const destinationRecord = type === 'destination'
        ? item
        : item.destinationRecord || destinations.find(destination => normalizeIndiaPlace(destination.name) === normalizeIndiaPlace(destinationName)) || null;
      results.push({ type, name, destination: destinationName, city: item.city || destinationName, state: item.state || destinationRecord?.state || '', description: descriptionOf(item), image: imageOf(item), destinationRecord, dataQuality: item.dataQuality || 'sample listing' });
    }
  };

  addResults('destination', destinations, item => item.name, item => item.name, item => item.shortDescription || item.description, item => item.image);
  addResults('attraction', indiaAttractions, item => item.name, item => item.destination, item => item.description, item => item.image);
  addResults('hotel', hotels, item => item.name, item => item.destinationName || item.destination, item => item.description, item => item.image);
  addResults('restaurant', regionalFoods, item => item.restaurantName || item.iconicRestaurant || item.dishName, item => item.destination, item => item.description, item => item.image);
  addResults('experience', experiences, item => item.title, item => item.destinationName || item.destinationId, item => item.description, item => item.image);
  addResults('guide', guides, item => item.name, item => item.destinationName, item => item.bio || item.description, item => item.photo);
  res.json({ query: q, total: results.length, results: results.slice(0, 30) });
});

app.get('/api/places', async (req, res) => {
  const { category = 'tourist attractions', destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  const response = getPlacesNearLocation({ ...coords, category, destination });
  res.json(response);
});

app.get('/api/places/nearby', async (req, res) => {
  const { category = 'tourist attractions', destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  const response = getPlacesNearLocation({ ...coords, category, destination });
  res.json(response);
});

app.get('/api/places/search', async (req, res) => {
  const { category = 'tourist attractions', destination = 'India', q = '' } = req.query;
  const coords = getLocationCoordinates(req);
  const response = searchPlaces({ ...coords, category, destination, q });
  res.json({
    total: response.length,
    destination,
    category,
    places: response,
    source: 'cached'
  });
});

app.get('/api/emergency/nearby', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  res.json(getNearbyEmergencyServices({ ...coords, destination, radiusKm: 15 }));
});

app.get('/api/emergency/hospitals', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  res.json({
    destination,
    services: getNearbyEmergencyServices({ ...coords, destination, radiusKm: 15 }).services.filter(item => item.type === 'hospital')
  });
});

app.get('/api/emergency/police', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  res.json({
    destination,
    services: getNearbyEmergencyServices({ ...coords, destination, radiusKm: 15 }).services.filter(item => item.type === 'police')
  });
});

app.get('/api/emergency/pharmacies', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  res.json({
    destination,
    services: getNearbyEmergencyServices({ ...coords, destination, radiusKm: 15 }).services.filter(item => item.type === 'pharmacy')
  });
});

app.get('/api/emergency/fire-stations', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  res.json({
    destination,
    services: getNearbyEmergencyServices({ ...coords, destination, radiusKm: 15 }).services.filter(item => item.type === 'fire')
  });
});

app.get('/api/weather', async (req, res) => {
  const destination = String(req.query.destination || req.query.name || 'Selected destination');
  const coords = getLocationCoordinates(req);
  const weather = await getWeatherForLocation({ ...coords, destination });
  res.json({
    destination,
    latitude: coords.latitude,
    longitude: coords.longitude,
    weather
  });
});

app.get('/api/map/markers', (req, res) => {
  const { destination = 'India' } = req.query;
  const coords = getLocationCoordinates(req);
  const payload = getPlacesNearLocation({ ...coords, category: 'tourist attractions', destination });
  const map = buildMapMarkers({ ...coords, destination, places: payload.places });
  res.json(map);
});

app.post('/api/ai/voice-assistant', (req, res) => {
  const payload = interpretVoiceMessage({
    message: req.body?.message,
    latitude: req.body?.latitude,
    longitude: req.body?.longitude,
    destination: req.body?.destination,
    language: req.body?.language,
    emergencyMode: Boolean(req.body?.emergencyMode)
  });
  res.json(payload);
});

app.post('/api/ai/chat', (req, res) => {
  const payload = interpretVoiceMessage({
    message: req.body?.message,
    latitude: req.body?.latitude,
    longitude: req.body?.longitude,
    destination: req.body?.destination,
    language: req.body?.language,
    emergencyMode: Boolean(req.body?.emergencyMode)
  });
  res.json({
    ...payload,
    suggestions: ["Find a hospital near me", "Check weather", "Open safety center"],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
});

// --- 2. DESTINATIONS & EXPLORE INDIA ---
app.get('/api/destinations', (req, res) => {
  const { category, state, crowdLevel, beyondTheCrowd, search } = req.query;
  let result = [...destinations];

  if (category && category !== 'All') {
    result = result.filter(d => 
      d.category.toLowerCase() === category.toLowerCase() || 
      (d.secondaryCategory && d.secondaryCategory.toLowerCase() === category.toLowerCase()) ||
      d.categories?.some(item => item.toLowerCase() === category.toLowerCase())
    );
  }

  if (state && state !== 'All') {
    result = result.filter(d => d.state.toLowerCase() === state.toLowerCase());
  }

  if (crowdLevel && crowdLevel !== 'All') {
    result = result.filter(d => d.crowdLevel === crowdLevel);
  }

  if (beyondTheCrowd === 'true') {
    result = result.filter(d => d.isBeyondTheCrowd === true);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.state.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.popularActivities.some(a => a.toLowerCase().includes(q))
    );
  }

  res.json({
    total: result.length,
    destinations: result,
    states: [...new Set(destinations.map(item => item.state))].sort(),
    categories: [...new Set(destinations.flatMap(item => item.categories || [item.category, item.secondaryCategory]).filter(Boolean))].sort()
  });
});

app.get('/api/destinations/:id', (req, res) => {
  const destination = destinations.find(d => d.id === req.params.id);
  if (!destination) {
    return res.status(404).json({ error: "Destination not found" });
  }

  // Correlate with hotels, experiences, food & weather
  const relatedHotels = hotels.filter(h => h.destinationId === destination.id);
  const relatedExperiences = experiences.filter(e => e.destinationId === destination.id);
  const relatedFood = regionalFoods.filter(f => f.destination.includes(destination.name.split(' ')[0]));
  const weather = weatherForecasts[destination.id] || {
    temperature: "27°C",
    condition: "Pleasant",
    rainProbability: "10%",
    smartRecommendation: "Good conditions for outdoor discovery."
  };

  res.json({
    destination,
    hotels: relatedHotels,
    experiences: relatedExperiences,
    food: relatedFood,
    weather
  });
});

// --- 3. AI TRIP PLANNER ENGINE ---
app.post('/api/itineraries/generate', (req, res) => {
  const parsed = parseTripRequest(req.body, destinations);
  const {
    naturalLanguageQuery,
    origin,
    destinationName,
    durationDays,
    travelers,
    budget,
    travelType,
    travelStyle,
    interests = ["Beaches", "Food", "Adventure"]
  } = parsed;

  if (!destinationName || !String(destinationName).trim()) {
    return res.status(400).json({
      success: false,
      error: "Destination is required. Please enter a real destination such as Goa, Coorg, Mysore, Hampi, or Mangalore."
    });
  }

  let targetDest = parsed.destination || {
    id: `custom-${Date.now()}`,
    name: destinationName,
    state: "Custom",
    region: "India",
    category: "Custom",
    secondaryCategory: "Travel",
    description: `Custom destination requested by traveler: ${destinationName}`,
    coordinates: { lat: 0, lng: 0 },
    bestTimeToVisit: "Any time",
    approxBudgetPerDay: 2000,
    crowdLevel: "Flexible",
    travelDifficulty: "Moderate",
    safetyRating: 4.5,
    safetyInfo: "Follow local guidance and standard travel precautions.",
    isBeyondTheCrowd: false,
    popularActivities: ["Local exploration", "Sightseeing", "Food discovery", "Cultural experiences"],
    localSpecialty: "Local cuisine and neighborhoods",
    tags: ["custom"]
  };

  if (parsed.destination && (
    normalizeDestination(parsed.destination.state) === normalizeDestination(destinationName) ||
    normalizeDestination(parsed.destination.name).includes(normalizeDestination(destinationName))
  )) {
    targetDest = { ...parsed.destination, name: destinationName };
  }

  const daysCount = Math.max(1, Math.min(Number(durationDays) || 3, 7));
  const dailyBudget = Math.floor(Number(budget) / daysCount);

  const matchedHotel = hotels.find(h => h.destinationId === targetDest.id) || {
    id: `hotel-${Date.now()}`,
    name: `${targetDest.name} Local Guesthouse`,
    destinationId: targetDest.id,
    destinationName: targetDest.name,
    pricePerNight: Math.max(1800, Number(budget) / Math.max(1, daysCount) / 2),
    rating: 4.6,
    roomType: "Standard Stay",
    features: ["Local hospitality", "Breakfast included", "Verified stay"]
  };
  const matchedExperiences = experiences.filter(e => e.destinationId === targetDest.id);
  const matchedGuides = guides.filter(guide => guide.destinationId === targetDest.id);
  const matchedFood = regionalFoods.filter(food =>
    normalizeDestination(food.destination).includes(normalizeDestination(targetDest.name))
  );
  const foodPlan = matchedFood[0] || {
    dishName: targetDest.localSpecialty || `Regional cuisine in ${targetDest.name}`,
    iconicRestaurant: `Local restaurants in ${targetDest.name}`
  };
  const matchedTransport = {
    id: `tr-planned-${Date.now()}`,
    origin,
    destination: targetDest.name,
    route: `${origin} → ${targetDest.name}`,
    travelers,
    totalEstimatedCost: Math.max(500, Math.round((targetDest.approxBudgetPerDay || 2000) * 0.5)) * travelers,
    type: `Intercity bus or rail to ${targetDest.name}`,
    duration: "Check current operator schedules",
    estimatedCost: Math.max(500, Math.round((targetDest.approxBudgetPerDay || 2000) * 0.5)),
    frequency: "Schedules vary by date",
    ecoRating: "Prefer shared public transit where available",
    badge: "Route estimate",
    amenities: ["Route uses the requested origin and destination"]
  };

  // Dynamic Day-by-Day generation
  const days = [];

  for (let i = 1; i <= daysCount; i++) {
    const isFirstDay = i === 1;
    const isLastDay = i === daysCount;
    const activity = targetDest.popularActivities[(i - 1) % targetDest.popularActivities.length];
    const experience = matchedExperiences[(i - 1) % Math.max(1, matchedExperiences.length)];

    days.push({
      day: i,
      date: `Day ${i}`,
      title: isFirstDay 
        ? `Arrival, Check-in & Iconic Local Flavors`
        : isLastDay 
          ? `Offbeat Artisan Discovery & Departure`
          : `Scenic Exploration, Water Adventures & Sunsets`,
      morning: {
        time: "08:30 AM - 11:30 AM",
        activity: isFirstDay
          ? `Check-in at ${matchedHotel.name}, then explore ${activity}. Local specialty: ${foodPlan.dishName}.`
          : `Explore ${activity} in ${targetDest.name}.`,
        cost: Math.round(dailyBudget * 0.25),
        location: targetDest.name,
        tips: "Start early to avoid the midday sun; stay hydrated."
      },
      afternoon: {
        time: "12:30 PM - 03:30 PM",
        activity: `Destination dining: visit ${foodPlan.iconicRestaurant} and try ${foodPlan.dishName}.`,
        cost: Math.round(dailyBudget * 0.35),
        location: `${targetDest.name} Center`,
        tips: "Dietary options available for Veg and Non-Veg."
      },
      evening: {
        time: "04:30 PM - 07:30 PM",
        activity: isLastDay
          ? `Visit a local market in ${targetDest.name} before preparing for the return journey.`
          : experience?.title || `Continue exploring ${targetDest.popularActivities[(i) % targetDest.popularActivities.length]}.`,
        cost: Math.round(dailyBudget * 0.2),
        location: targetDest.name,
        tips: "Sunset peak colors occur around 6:15 PM."
      }
    });
  }

  const estimatedExpense = {
    hotels: matchedHotel.pricePerNight * Math.max(1, daysCount - 1),
    transport: matchedTransport.estimatedCost * travelers,
    food: Math.round(dailyBudget * 0.45 * daysCount),
    activities: Math.round(dailyBudget * 0.25 * daysCount),
    buffer: Math.round(dailyBudget * 0.1 * daysCount)
  };
  const totalEstimatedCost = Object.values(estimatedExpense).reduce((a, b) => a + b, 0);
  const weather = weatherForecasts[targetDest.id];

  const itinerary = {
    id: `trip-ai-${Date.now()}`,
    title: `${daysCount}-Day Personalized Trip: ${targetDest.name}`,
    origin,
    destination: targetDest.name,
    durationDays: daysCount,
    travelers,
    travelType,
    travelStyle,
    totalBudget: Number(budget),
    estimatedCost: totalEstimatedCost,
    remainingBudget: Math.max(0, Number(budget) - totalEstimatedCost),
    targetDestination: targetDest,
    hotel: matchedHotel,
    transport: matchedTransport,
    experiences: matchedExperiences,
    restaurants: matchedFood,
    guides: matchedGuides,
    weather,
    safety: targetDest.safetyInfo,
    days,
    expenses: [
      { id: "exp-hotel", category: "Hotel", title: `${matchedHotel.name} (${daysCount - 1} nights)`, amount: estimatedExpense.hotels },
      { id: "exp-tr", category: "Transport", title: `${matchedTransport.type} (${travelers} travelers)`, amount: estimatedExpense.transport },
      { id: "exp-food", category: "Food", title: "Regional Dining & Snacks", amount: estimatedExpense.food },
      { id: "exp-act", category: "Activities", title: "Guided Tours & Entry Passes", amount: estimatedExpense.activities },
      { id: "exp-buf", category: "Buffer / Misc", title: "Emergency & Local Incidentals", amount: estimatedExpense.buffer }
    ],
    weatherSummary: weather
      ? `${weather.temperature} · ${weather.condition} · Demo forecast`
      : `Demo weather estimate for ${targetDest.name}; check a live forecast before departure.`,
    weatherAlert: weather?.smartRecommendation || `Check a live local forecast for ${targetDest.name} before outdoor activities.`,
    safetyTip: targetDest.safetyInfo,
    localEtiquette: "Modest attire inside temple sanctuaries and heritage sites. Always carry reusable bottles."
  };

  if (String(itinerary.destination).trim() !== String(destinationName).trim()) {
    console.error('Destination mismatch detected:', {
      requestedDestination: destinationName,
      generatedDestination: itinerary.destination
    });
    return res.status(409).json({
      success: false,
      error: `Destination mismatch: requested ${destinationName}, received ${itinerary.destination}. Regenerate with the requested destination.`
    });
  }

  res.json({
    success: true,
    message: "Personalized AI Itinerary synthesized successfully",
    requestedDestination: destinationName,
    itinerary
  });
});

// --- 4. ITINERARY MODIFIERS ---
app.post('/api/itineraries/modify', (req, res) => {
  const { itinerary, modifier } = req.body;
  if (!itinerary) {
    return res.status(400).json({ error: "Itinerary payload required" });
  }

  let updated = JSON.parse(JSON.stringify(itinerary));
  const localActivities = updated.targetDestination?.popularActivities || [`local activities in ${updated.destination}`];

  if (modifier === "More Adventure") {
    updated.title = `${updated.title} (Adventure Special)`;
    updated.days.forEach((day, index) => {
      day.morning.activity = `Add an active visit to ${localActivities[index % localActivities.length]} in ${updated.destination}.`;
      day.evening.activity = `Explore another local outdoor experience in ${updated.destination}.`;
    });
  } else if (modifier === "More Relaxed") {
    updated.title = `${updated.title} (Slow Travel & Wellness)`;
    updated.days.forEach((day, index) => {
      day.morning.activity = `Take a relaxed visit to ${localActivities[index % localActivities.length]} in ${updated.destination}.`;
      day.afternoon.activity = `Enjoy an unhurried local meal and free time in ${updated.destination}.`;
    });
  } else if (modifier === "Family Friendly") {
    updated.title = `${updated.title} (Family & Kids Friendly)`;
    updated.days.forEach((day, index) => {
      day.morning.activity = `Family-friendly visit to ${localActivities[index % localActivities.length]} in ${updated.destination}.`;
      day.evening.activity = `Choose a relaxed local activity and family dining in ${updated.destination}.`;
    });
  } else if (modifier === "Change Budget") {
    const newBudget = req.body.newBudget || updated.totalBudget * 0.8;
    updated.totalBudget = newBudget;
    updated.estimatedCost = Math.round(newBudget * 0.9);
    updated.remainingBudget = Math.round(newBudget * 0.1);
  }

  res.json({
    success: true,
    message: `Itinerary successfully modified with ${modifier}`,
    itinerary: updated
  });
});

// --- 5. HOTELS & BOOKING ---
app.get('/api/hotels', (req, res) => {
  const { destinationId, destination, maxPrice, rating } = req.query;
  let result = [...hotels];

  if ((destinationId && destinationId !== 'All') || (destination && destination !== 'All')) {
    const records = getDestinationRecords(destinationId, destination);
    result = result.filter(h => matchesDestination(h, records, destination));
  }
  if (maxPrice) {
    result = result.filter(h => h.pricePerNight <= Number(maxPrice));
  }
  if (rating) {
    result = result.filter(h => h.rating >= Number(rating));
  }

  res.json({ total: result.length, hotels: result });
});

app.post('/api/hotels/book', (req, res) => {
  const { hotelId, guestName, dates, guests = 2 } = req.body;
  const hotel = hotels.find(h => h.id === hotelId);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found for this trip.' });
  
  const newBooking = {
    id: `BK-HTL-${Date.now().toString().slice(-4)}`,
    itemType: "Hotel",
    title: hotel.name,
    destination: hotel.destinationName,
    checkIn: dates?.checkIn || "Day 1",
    checkOut: dates?.checkOut || "Day 3",
    guests,
    amount: hotel.pricePerNight * 2,
    status: "Confirmed",
    qrCode: `TE-HTL-CONFIRMED-${Date.now()}`
  };

  activeBookings.unshift(newBooking);

  res.json({
    success: true,
    message: `Booking confirmed at ${hotel.name}! Added to Digital Travel Wallet.`,
    booking: newBooking
  });
});

// --- 6. LOCAL EXPERIENCES MARKETPLACE ---
app.get('/api/experiences', (req, res) => {
  const { category, destinationId, destination } = req.query;
  let result = [...experiences];

  if (category && category !== 'All') {
    result = result.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }
  if ((destinationId && destinationId !== 'All') || (destination && destination !== 'All')) {
    const records = getDestinationRecords(destinationId, destination);
    result = result.filter(e => matchesDestination(e, records, destination));
  }

  res.json({ total: result.length, experiences: result });
});

app.post('/api/experiences/book', (req, res) => {
  const { experienceId, travelers = 2 } = req.body;
  const exp = experiences.find(e => e.id === experienceId);
  if (!exp) return res.status(404).json({ error: 'Experience not found for this trip.' });

  const newBooking = {
    id: `BK-EXP-${Date.now().toString().slice(-4)}`,
    itemType: "Experience",
    title: exp.title,
    destination: exp.destinationId,
    guests: travelers,
    amount: exp.price * travelers,
    status: "Confirmed",
    qrCode: `TE-EXP-${Date.now()}`
  };

  activeBookings.unshift(newBooking);

  res.json({
    success: true,
    message: `Reserved ${exp.title} with host ${exp.host}. Added to your Travel Wallet!`,
    booking: newBooking
  });
});

// --- 7. VERIFIED LOCAL GUIDES ---
app.get('/api/guides', (req, res) => {
  const { language, destinationId, destination } = req.query;
  let result = [...guides];

  if (language && language !== 'All') {
    result = result.filter(g => g.languages.some(l => l.toLowerCase() === language.toLowerCase()));
  }
  if ((destinationId && destinationId !== 'All') || (destination && destination !== 'All')) {
    const records = getDestinationRecords(destinationId, destination);
    result = result.filter(g => matchesDestination(g, records, destination));
  }

  res.json({ total: result.length, guides: result });
});

app.post('/api/guides/book', (req, res) => {
  const { guideId, days = 1, notes, travelers = 1 } = req.body;
  const guide = guides.find(g => g.id === guideId);
  if (!guide) return res.status(404).json({ error: 'Guide not found for this trip.' });

  const newBooking = {
    id: `BK-GD-${Date.now().toString().slice(-4)}`,
    itemType: "Local Guide",
    title: `Verified Guide: ${guide.name}`,
    destination: guide.destinationName,
    guests: travelers,
    amount: guide.dailyFee * days,
    status: "Confirmed",
    qrCode: `TE-GUIDE-${guide.id}`
  };

  activeBookings.unshift(newBooking);

  res.json({
    success: true,
    message: `Booked ${guide.name} (${guide.verifiedBadge}). Contact: ${guide.phone}.`,
    booking: newBooking
  });
});

// --- 8. TRANSPORTATION HUB ---
app.get('/api/transport', (req, res) => {
  const { origin, destination } = req.query;
  if (!destination) {
    return res.json({ options: [] });
  }
  const normalizedOrigin = normalizeDestination(origin);
  const normalizedTarget = normalizeDestination(destination);
  const exactRoutes = transportOptions.filter(option =>
    normalizeDestination(option.origin) === normalizedOrigin &&
    normalizeDestination(option.destination) === normalizedTarget
  );
  const options = exactRoutes.length > 0
    ? exactRoutes
    : buildIndiaTransportOptions(String(origin || ''), String(destination), destinations);
  res.json({
    origin,
    destination,
    options
  });
});

// --- 9. TASTE LOCAL FOOD ---
app.get('/api/food', (req, res) => {
  const { dietary, destinationId, destination } = req.query;
  let result = [...regionalFoods];

  if ((destinationId && destinationId !== 'All') || (destination && destination !== 'All')) {
    const records = getDestinationRecords(destinationId, destination);
    result = result.filter(food => matchesDestination(food, records, destination));
    if (result.length === 0 && records.length > 0) {
      const selected = records[0];
      result = [{
        id: `food-demo-${selected.id}`,
        dishName: selected.localSpecialty || `Regional cuisine in ${selected.name}`,
        destination: selected.name,
        dietary: 'Local options vary by restaurant',
        iconicRestaurant: `Local restaurants in ${selected.name}`,
        priceRange: 'Check local menus',
        hygieneRating: 'Choose a well-rated local establishment',
        description: `Destination-specific food suggestion based on the local specialty data for ${selected.name}.`,
        mustTryBadge: 'Local specialty · Demo data'
      }];
    }
  }

  if (dietary && dietary !== 'All') {
    result = result.filter(f => f.dietary.toLowerCase().includes(dietary.toLowerCase()));
  }

  res.json({ total: result.length, foods: result });
});

// --- 10. SAFETY & EMERGENCY SOS ---
app.get('/api/safety', (req, res) => {
  const { destinationId, destination } = req.query;
  const records = getDestinationRecords(destinationId, destination);
  const names = records.map(item => normalizeDestination(item.name));
  const matches = item => names.some(name => normalizeDestination(item.destination).includes(name));
  const safetyInfo = records[0]?.safetyInfo || null;
  res.json({
    destination: destination || null,
    safetyInfo,
    emergencyDirectory: {
      ...emergencySafetyDirectory,
      nearbyHospitals: records.length ? emergencySafetyDirectory.nearbyHospitals.filter(matches) : [],
      nearbyPoliceStations: records.length ? emergencySafetyDirectory.nearbyPoliceStations.filter(matches) : []
    }
  });
});

app.post('/api/safety/sos', (req, res) => {
  const { location, tripId, userNotes, destinationId, destination } = req.body;
  const destinationRecords = getDestinationRecords(destinationId, destination);
  const names = destinationRecords.map(item => normalizeDestination(item.name));
  const nearestHospital = emergencySafetyDirectory.nearbyHospitals.find(hospital =>
    names.some(name => normalizeDestination(hospital.destination).includes(name))
  ) || null;
  const nearestPoliceStation = emergencySafetyDirectory.nearbyPoliceStations.find(station =>
    names.some(name => normalizeDestination(station.destination).includes(name))
  ) || null;

  const sosPayload = {
    sosId: `SOS-ALERT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: "DISPATCH_SIMULATED",
    coordinates: location || null,
    emergencyHotlinesNotified: ["112 (National)", "100 (Police)", "1363 (Tourist Helpline)"],
    nearestHospital,
    nearestPoliceStation,
    emergencyShareLink: `https://tripease.in/sos/live-track?id=SOS-${Date.now()}`,
    safetyConfirmation: "Help is on the way. Keep phone active and stay in a well-lit area."
  };

  res.json({
    success: true,
    sos: sosPayload
  });
});

// --- 11. WEATHER & TRAVEL CONDITIONS ---
app.get('/api/weather', (req, res) => {
  const { destinationId, destination } = req.query;
  const records = getDestinationRecords(destinationId, destination);
  const selected = records[0];
  const weather = selected ? weatherForecasts[selected.id] || {
    condition: `Demo forecast for ${destination || selected.name}`,
    smartRecommendation: `Check a live local forecast for ${destination || selected.name} before outdoor activities.`
  } : null;
  res.json({
    destinationId: selected?.id || destinationId || null,
    destination: destination || selected?.name || null,
    weather
  });
});

// --- 12. DIGITAL TRAVEL WALLET & BOOKINGS ---
app.get('/api/wallet', (req, res) => {
  res.json({
    activeBookings,
    offlinePassAvailable: true,
    walletPassId: "TE-PASS-SIH2026-IND",
    syncedAt: new Date().toISOString()
  });
});

// --- 13. REVIEWS SYSTEM ---
app.get('/api/reviews', (req, res) => {
  res.json({
    reviews: verifiedReviews
  });
});

app.post('/api/reviews', (req, res) => {
  const { author, travelerType, rating, comment, itemTitle } = req.body;
  const newRev = {
    id: `rev-${Date.now()}`,
    author: author || "Verified Tourist",
    travelerType: travelerType || "Explorer",
    rating: Number(rating) || 5,
    date: "Just now",
    itemType: "Experience & Stay",
    itemTitle: itemTitle || "TripEase Verified Journey",
    comment: comment || "Wonderful experience booking through TripEase!",
    verifiedBooking: true,
    likes: 1
  };

  verifiedReviews.unshift(newRev);

  res.json({
    success: true,
    message: "Thank you! Your verified review is published.",
    review: newRev
  });
});

// --- 14. LOCAL BUSINESS DASHBOARD ---
app.get('/api/business/dashboard', (req, res) => {
  res.json({
    businesses: businessListings,
    inquiries: localInquiries,
    analytics: {
      totalLocalRevenue: 285500,
      totalGuestsHosted: 247,
      communityEmploymentImpact: "58 rural households supported"
    }
  });
});

app.post('/api/business/register', (req, res) => {
  const { businessName, type, ownerName, location, phone } = req.body;
  const newBiz = {
    id: `biz-${Date.now()}`,
    businessName: businessName || "New Local Tourism Partner",
    type: type || "Local Experience",
    ownerName: ownerName || "Local Host",
    location: location || "Karnataka",
    phone: phone || "+91 99000 00000",
    status: "Verification Pending (24hr Review)",
    revenue: 0,
    bookingsCount: 0,
    rating: 5.0
  };

  businessListings.push(newBiz);

  res.json({
    success: true,
    message: "Business listing submitted for verification.",
    business: newBiz
  });
});

// --- 15. ADMIN DASHBOARD (SIH 2026 OVERSIGHT) ---
app.get('/api/admin/stats', (req, res) => {
  res.json({
    sihProject: "TripEase (YATRA360)",
    problemStatementId: "26204",
    totalUsers: 14280,
    activeTripsPlanned: 3820,
    totalBookings: 18450,
    registeredLocalBusinesses: 420,
    verifiedGuides: 195,
    localEconomyRevenueRouted: "₹1,48,90,000",
    popularDestinations: [
      { name: "Udupi & Coastal Karnataka", trips: 1250 },
      { name: "Hampi & Anegundi", trips: 940 },
      { name: "Munnar Misty Highlands", trips: 780 },
      { name: "Divar Island Heritage Haven", trips: 510 },
      { name: "Bundi Stepwells", trips: 340 }
    ],
    verificationQueue: [
      { id: "vq-1", name: "Malpe Kayak Club", category: "Watersports", docsSubmitted: "Govt. Life-Saving License", status: "Ready for Approval" },
      { id: "vq-2", name: "Kishkindha Banana Weavers", category: "Rural Handicrafts", docsSubmitted: "MSME Udyam Certificate", status: "Ready for Approval" }
    ]
  });
});

// --- 16. YATRA ASSISTANT AI CHATBOT ---
const normalizeChatMessage = (value = '') => (value || '').replace(/\s+/g, ' ').replace(/[\u00A0]/g, ' ').trim();

const formatCurrency = (amount) => {
  const number = Number(amount) || 0;
  return `₹${number.toLocaleString('en-IN')}`;
};

const detectChatIntent = (message) => {
  const text = normalizeChatMessage(message).toLowerCase().replace(/[.!?,]+$/g, '');
  if (/^(?:hi|hii+|hlo|hello|hey|hey there|hello assistant|hi tripease|hey tripease|good morning|good afternoon|good evening|how are you|are you there)$/.test(text)) return 'greeting';
  if (/^(?:bye|goodbye|see you|see you later)$/.test(text)) return 'farewell';
  if (/^(?:thank you|thanks|thank you so much|thanks a lot)$/.test(text)) return 'thanks';
  if (/^(?:how are you|how are you doing)$/.test(text)) return 'general_conversation';
  if (/^(?:help|what can you do|how can you help me|what can you help me with)$/.test(text)) return 'help';
  if (/\b(emergency|sos|urgent|hospital|police|ambulance)\b/.test(text)) return 'emergency';
  if (/\b(safety|safe|danger|customs|custom|etiquette)\b/.test(text)) return 'safety';
  if (/\b(weather|forecast|rain|temperature)\b/.test(text)) return 'weather';
  if (/\b(local guide|guides|guide)\b/.test(text)) return 'guide';
  if (/\b(hotel|hotels|stay|accommodation|resort)\b/.test(text)) return 'hotel';
  if (/\b(restaurant|restaurants|eatery|dining)\b/.test(text)) return 'restaurant';
  if (/\b(food|eat|cuisine|dish|meal|eatery)\b/.test(text)) return 'food';
  if (/\b(transport|bus|train|flight|taxi|cab|travel to)\b/.test(text)) return 'transport';
  if (/\b(experience|experiences|activity|activities|local|culture|customs)\b/.test(text)) return 'local_experience';
  if (/\b(expense|expenses|spent|transaction|receipt)\b/.test(text)) return 'expense';
  if (/\b(budget|remaining|cost|money|price|fare)\b/.test(text)) return 'budget';
  if (/\b(itinerary|day plan|schedule|change plan)\b/.test(text)) return 'itinerary';
  if (/\bday\s*#?\s*\d+\b/.test(text)) return 'day_plan';
  if (/\b(destination|where should i go|suggest a place|suggest a destination|i don't know where to go|i do not know where to go)\b/.test(text)) return 'destination';
  if (/\b(plan|planning|trip|travel|holiday|vacation)\b/.test(text)) return 'trip_planning';
  if (safeArithmeticParse(text) !== null && /[+*/%]|\d\s*-\s*\d/.test(text)) return 'calculation';
  if (/[₹$€£]|\b(?:rs\.?|inr)\b/i.test(text) && /\d/.test(text)) return 'numerical_input';
  if (/^(?:₹|\$|€|£|rs\.?|inr)?\s*\d[\d,.]*(?:\s*(?:rupees?|inr))?$/i.test(text)) return 'numerical_input';
  if (/^(?:beaches|mountains|nature|historical places|weekend getaway)$/.test(text)) return 'general_conversation';
  return 'unknown';
};

const safeArithmeticParse = (expression) => {
  const cleaned = normalizeChatMessage(expression)
    .replace(/₹/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/inr/gi, '')
    .replace(/\$/g, '')
    .replace(/€/g, '')
    .replace(/£/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '');

  if (!cleaned || !/^[0-9+\-*/().%]+$/.test(cleaned)) return null;

  const tokens = cleaned.match(/\d*\.?\d+|[()+\-*/%]/g) || [];
  if (!tokens.length) return null;

  let pointer = 0;
  const peek = () => tokens[pointer];
  const consume = () => tokens[pointer++];

  const parsePrimary = () => {
    const token = peek();
    if (!token) throw new Error('Unexpected end');
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

  const parseMult = () => {
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

  const parseAddSubtract = () => {
    let total = parseMult();
    while (['+', '-'].includes(peek() || '')) {
      const op = consume();
      const right = parseMult();
      if (op === '+') total += right;
      if (op === '-') total -= right;
    }
    return total;
  };

  try {
    const result = parseAddSubtract();
    return pointer === tokens.length && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

app.post('/api/chat', (req, res) => {
  const { message, tripContext, destinationContext, currentLocation, conversationHistory = [] } = req.body;
  const msg = normalizeChatMessage(message);
  const fullMsg = msg.toLowerCase();
  const intent = detectChatIntent(msg);
  const previousAssistantText = [...conversationHistory].reverse().find((entry) => entry?.sender === 'assistant')?.text?.toLowerCase() || '';
  const destination = tripContext?.destination;
  const destinationInfo = tripContext?.targetDestination || destinationContext;
  const tripDays = tripContext?.days || [];
  const requestedLocationMatch = msg.match(/\b(?:in|near|around)\s+([a-z][a-z\s'-]*?)(?=\s+(?:for|under|with|and)\b|[?.!,]|$)/i)?.[1]?.trim();
  const requestedLocation = /^(?:me|here|nearby|my location|this area)$/i.test(requestedLocationMatch || '') ? '' : requestedLocationMatch;
  const currentLocationName = currentLocation?.source === 'current_location' ? currentLocation.locationName : '';
  const listingDestination = requestedLocation || destination || currentLocationName || destinationContext?.name || '';
  const listingDestinationRecords = listingDestination ? getDestinationRecords(undefined, listingDestination) : [];
  const listingDestinationLabel = listingDestinationRecords[0]?.name || listingDestination;
  const destinationListings = (items) => items.filter(item => matchesDestination(item, listingDestinationRecords, listingDestination));
  const destinationHotels = destinationListings(hotels);
  const destinationExperiences = destinationListings(experiences);
  const destinationFoods = destinationListings(regionalFoods);
  const destinationGuides = destinationListings(guides);

  let response = destination
    ? `I can help with your active trip to ${destination}. Ask about a day plan, local food, budget, or destination safety.`
    : 'I can help you plan a trip, discover destinations, and explore travel options. What are you interested in?';
  let quickSuggestions = ['Where should I go tomorrow?', 'Find a cheap restaurant near me', 'How much money have I spent?', 'Show nearby emergency services'];

  const calcResult = safeArithmeticParse(msg);
  if (intent === 'greeting') {
    response = /^(?:good morning|good afternoon|good evening)$/i.test(msg)
      ? `${msg.charAt(0).toUpperCase()}${msg.slice(1)}! Where would you like to explore today?`
      : /^(?:how are you|how are you doing)[.!?]*$/i.test(msg)
        ? "I'm doing great and ready to help you plan your next adventure! What can I do for you?"
        : /^are you there\??$/i.test(msg)
          ? "Yes, I'm here! 😊 How can I help you?"
          : "Hello! 👋 How can I help you today?";
    quickSuggestions = ['Plan a trip', 'Suggest a destination', 'What can you do?'];
  } else if (intent === 'thanks') {
    response = "You're welcome! 😊 Happy to help.";
    quickSuggestions = ['Plan a trip', 'Explore destinations'];
  } else if (intent === 'farewell') {
    response = 'Goodbye! Have a wonderful day and happy travels! ✈️';
    quickSuggestions = [];
  } else if (intent === 'help') {
    response = 'I can help you plan trips, discover destinations, find local food, explore hotels, manage your travel budget, and get travel safety information. What would you like to explore?';
    quickSuggestions = ['Plan a trip', 'Suggest a destination', 'Check my budget'];
  } else if (intent === 'general_conversation' && /^(?:how are you|how are you doing)$/i.test(msg)) {
    response = "I'm doing great and ready to help you plan your next adventure! What can I do for you?";
    quickSuggestions = ['Plan a trip', 'Suggest a destination', 'Explore local food'];
  } else if (intent === 'calculation' && calcResult !== null) {
    response = `${normalizeChatMessage(msg)} = ${formatCurrency(calcResult)}`;
    quickSuggestions = ['Track this as my budget', 'Review trip expenses', 'View itinerary'];
  } else if (intent === 'numerical_input') {
    const currencyMatch = msg.match(/(?:₹|\$|€|£|\brs\.?|\binr)\s*([\d,]+(?:\.\d+)?)/i);
    const numericMatch = msg.match(/^\s*(\d[\d,]*(?:\.\d+)?)\s*$/);
    const value = Number((currencyMatch?.[1] || numericMatch?.[1] || '0').replace(/,/g, ''));
    if ((currencyMatch || numericMatch) && /budget/.test(previousAssistantText)) {
      response = `Got it! I'll use ${formatCurrency(value)} as your budget. How many days are you planning to travel?`;
      quickSuggestions = ['3 days', '5 days', 'Plan my trip'];
    } else if (currencyMatch) {
      response = `I recognized ${formatCurrency(value)} as a currency amount. Would you like to use it as a trip budget or ask about a specific expense?`;
      quickSuggestions = ['Use as trip budget', 'Check expenses', 'Something else'];
    } else {
      response = `I received ${value.toLocaleString('en-IN')}. What does that number represent?`;
      quickSuggestions = ['My budget', 'Number of travelers', 'Something else'];
    }
  } else if (/(?:₹|rs\.?|inr|\$|€|£)/i.test(msg) && /(budget|cost|money|spent|expense|fare|price|have|for this trip|this trip|trip budget)/i.test(msg)) {
    const amount = (msg.match(/(?:₹|rs\.?|inr|\$|€|£)\s*([\d,]+(?:\.\d+)?)/i) || [null, '0'])[1];
    const value = Number((amount || '0').replace(/,/g, ''));
    response = `I recognized ${formatCurrency(value)} as a currency amount. ${tripContext ? `Your trip budget is ${formatCurrency(tripContext.totalBudget || 0)} and ${formatCurrency(Math.max(0, (tripContext.totalBudget || 0) - (tripContext.spent || 0)))} remains.` : 'This looks like a trip budget value; tell me how you want to use it.'}`;
    quickSuggestions = ['Track this as my budget', 'Check expense summary', 'Plan next day'];
  } else if ((/\b(?:we are|there are|traveling with|travelling with|group of|travelers?|people|friends|guests|companions)\b/i.test(msg) && /\d/.test(msg)) || /\b\d+\s*(?:friends|traveler|travellers|travelers|people|guests|companions)\b/i.test(msg)) {
    const travelerCount = Number((msg.match(/\b(\d+(?:\.\d+)?)\s*(?:friends|traveler|travellers|travelers|people|guests|companions)\b/i) || [null, '1'])[1]);
    response = `I understood the trip group size as ${travelerCount || 1} travelers.`;
    quickSuggestions = ['Check room booking', 'Adjust itinerary', 'Review budget'];
  } else {
    const requestedDay = fullMsg.match(/day\s*(\d+)/i);
    if (requestedDay && destination) {
      const day = tripDays[Number(requestedDay[1]) - 1];
      response = day
        ? `${destination}, Day ${day.day}: Morning: ${day.morning.activity} Afternoon: ${day.afternoon.activity} Evening: ${day.evening.activity}`
        : `Your ${destination} itinerary has ${tripDays.length} days. Choose a day from 1 to ${tripDays.length}.`;
      quickSuggestions = ['Find local food for this trip', 'Check trip budget', 'Show on interactive map'];
    } else if (requestedDay) {
      response = `I don't see an active trip yet. Which destination should I use to suggest a plan for Day ${requestedDay[1]}?`;
      quickSuggestions = ['Plan a trip', 'Suggest a destination'];
    } else if ((fullMsg.includes('tomorrow') || fullMsg.includes('go tomorrow') || fullMsg.includes('next')) && destination) {
      const day = tripDays[1] || tripDays[0];
      response = day
        ? `For ${destination}, ${day.date}: ${day.morning.activity} Then ${day.afternoon.activity} In the evening: ${day.evening.activity}`
        : `Your active trip is to ${destination}. Open Plan My Trip to see its itinerary.`;
      quickSuggestions = ['Show on interactive map', 'Check weather forecast', 'Add to day plan'];
    } else if (intent === 'trip_planning' && !destination) {
      const requestedDestination = msg.match(/\b(?:to|in|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
      response = requestedDestination
        ? `${requestedDestination[1]} sounds exciting! I can help plan your trip there. How many days are you thinking, and what is your approximate budget?`
        : 'That sounds exciting! 😊 Where are you thinking of going? If you are undecided, I can suggest beaches, mountains, nature escapes, or historical places.';
      quickSuggestions = ['Suggest a destination', 'Plan a trip to Goa', 'Explore beaches'];
    } else if (intent === 'general_conversation' && /^(?:beaches|mountains|nature|historical places|weekend getaway)$/.test(fullMsg) && /(?:what kind|looking for|enjoy)/.test(previousAssistantText)) {
      response = `If you're looking for ${fullMsg}, I can suggest destinations based on your budget and travel dates. What is your budget?`;
      quickSuggestions = ['Weekend trip', '5 days', 'Suggest a destination'];
    } else if (intent === 'destination' && !destination) {
      response = /i don't know where to go|i do not know where to go/i.test(msg)
        ? 'No problem! Are you looking for beaches, mountains, nature, historical places, or a relaxing weekend getaway?'
        : 'Sure! Are you planning a weekend trip or a longer holiday? And what is your approximate budget?';
      quickSuggestions = /i don't know where to go|i do not know where to go/i.test(msg)
        ? ['Beaches', 'Mountains', 'Historical places']
        : ['Weekend trip', 'Longer holiday', 'Share my budget'];
    } else if (fullMsg.includes('cheap') || intent === 'restaurant' || intent === 'food') {
      const food = destinationFoods[0] || tripContext?.restaurants?.[0];
      const localFood = food
        ? `${food.dishName} at ${food.restaurantName || food.iconicRestaurant}`
        : destinationInfo?.localSpecialty || `local cuisine in ${listingDestinationLabel || 'your chosen destination'}`;
      const asksNearby = /\b(?:near me|nearby|around me|my location)\b/i.test(msg);
      response = listingDestination
        ? `For ${listingDestinationLabel}, try ${localFood}. Check local menus for current prices and dietary options.`
        : asksNearby
          ? "I don't have your current location. Allow location access or share a city, and I'll find nearby food."
          : 'I can find local food for you. Which destination or area should I look near?';
      quickSuggestions = ['View Taste Local menu', 'Check food dietary options', 'Add to meals'];
    } else if (intent === 'expense' || fullMsg.includes('money') || fullMsg.includes('budget') || fullMsg.includes('spent')) {
      if (tripContext) {
        const totalBudget = Number(tripContext.totalBudget) || 0;
        const spent = Number(tripContext.spent) || 0;
        response = `${destination} trip budget: ₹${totalBudget.toLocaleString('en-IN')} total, ₹${spent.toLocaleString('en-IN')} spent, ₹${Math.max(0, totalBudget - spent).toLocaleString('en-IN')} remaining.`;
      } else {
        response = 'I don’t have an active trip budget yet. Are you setting a budget for a new trip, or asking about a particular expense?';
      }
      quickSuggestions = ['Add a manual expense', 'View expense breakdown', 'See cost-saving tips'];
    } else if (fullMsg.includes('pack') || fullMsg.includes('packing')) {
      response = destination
        ? `For ${destination}, check the forecast before packing. Bring comfortable walking shoes, sun protection, and clothing appropriate for the local sites and activities.`
        : 'Create a trip first and I can tailor packing suggestions to its destination and activities.';
      quickSuggestions = ['Check current weather', 'View local customs'];
    } else if (fullMsg.includes('custom') || fullMsg.includes('rules') || fullMsg.includes('etiquette')) {
      response = destination
        ? `For ${destination}: ${destinationInfo?.safetyInfo || tripContext.safety || 'Follow posted site rules, respect local customs, and ask before photographing people.'}`
        : 'Create a trip first and I can share destination-specific etiquette and safety guidance.';
      quickSuggestions = ['Explore local experiences', 'Find verified local guides'];
    } else if (fullMsg.includes('emergency') || fullMsg.includes('safety') || fullMsg.includes('hospital') || fullMsg.includes('police')) {
      response = `For urgent help dial 112 (National Helpline), 108 (Ambulance), or 1363 (Tourist Helpline). ${destination ? `${destination} guidance: ${destinationInfo?.safetyInfo || tripContext?.safety || 'Follow local emergency-service guidance.'}` : 'Create a trip to load destination-specific safety guidance.'} Tap the SOS button to open emergency assistance.`;
      quickSuggestions = ['Open SOS Emergency Screen', 'Call 112 National Helpline', 'Find nearby police station'];
    } else if (fullMsg.includes('change') || fullMsg.includes('itinerary')) {
      response = 'I can adjust your itinerary right away! Would you like "More Adventure", "More Relaxed", "Family Friendly", or to adjust your daily budget? You can also swap any activity directly in the Plan My Trip view.';
      quickSuggestions = ['More Adventure', 'More Relaxed', 'Family Friendly', 'Change Budget'];
    } else if (intent === 'hotel') {
      response = destinationHotels.length
        ? `Here are demo stays in ${listingDestinationLabel}: ${destinationHotels.slice(0, 3).map(item => `${item.name} (from ₹${item.pricePerNight}/night)`).join('; ')}. Rates and availability should be confirmed with each property.`
        : listingDestination
          ? `I don't have stays listed for ${listingDestinationLabel} yet. Try another nearby destination or browse Hotels & Stays for recommendations.`
          : 'Which destination should I search for hotels in?';
      quickSuggestions = ['Open Hotels & Stays', 'Find local food', 'Find a local guide'];
    } else if (intent === 'weather') {
      response = destination
        ? `I can help check what to expect in ${destination}. For the latest forecast, use the Weather section so you get current conditions for your trip.`
        : 'Which destination would you like the weather for?';
      quickSuggestions = ['Check trip weather', 'Suggest a destination'];
    } else if (intent === 'transport') {
      response = destination
        ? `For getting around ${destination}, I can help compare transport options. Are you looking for local transit, a taxi, or intercity travel?`
        : 'Where are you traveling from and to, and would you prefer bus, train, flight, or local transport?';
      quickSuggestions = ['Bus', 'Train', 'Flight'];
    } else if (intent === 'local_experience') {
      response = destinationExperiences.length
        ? `Here are demo experiences for ${listingDestinationLabel}: ${destinationExperiences.slice(0, 3).map(item => item.title).join('; ')}. Open Local Experiences to explore details and availability.`
        : listingDestination
          ? `I can help you discover local food, culture, markets, and activities in ${listingDestinationLabel}. What sounds interesting?`
          : 'I can help you discover local food, culture, markets, and activities. Which destination are you curious about?';
      quickSuggestions = ['Local food', 'Cultural activities', 'Suggest a destination'];
    } else if (intent === 'guide') {
      response = destinationGuides.length
        ? `Here are demo local guides for ${listingDestinationLabel}: ${destinationGuides.slice(0, 3).map(item => item.name).join(', ')}. Open Local Guides to compare languages, expertise, and rates.`
        : listingDestination
          ? `I don't have guide profiles for ${listingDestinationLabel} yet. Browse Local Guides for nearby recommendations.`
          : 'Which destination should I find a local guide for?';
      quickSuggestions = ['Open Local Guides', 'Find local experiences', 'Suggest a destination'];
    } else if (intent === 'unknown') {
      response = 'I can help with that! Could you tell me a little more about what you need?';
      quickSuggestions = ['Plan a trip', 'Find local food', 'Manage my budget'];
    }
  }

  res.json({
    reply: response,
    suggestions: quickSuggestions,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
});

// --- 17. 1-CLICK HACKATHON JUDGE DEMO MODE ---
app.get('/api/demo/judge-package', (req, res) => {
  res.json({
    success: true,
    message: "Smart India Hackathon 2026 Judge Demo Mode Activated",
    package: demoJudgePackage
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🧭 TripEase / YATRA360 Backend API Server Running`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`🏆 Smart India Hackathon 2026 | Problem Statement 26204`);
  console.log(`🎯 Theme: Travel & Tourism (AICTE & MIC Innovation)`);
  console.log(`====================================================`);
});
