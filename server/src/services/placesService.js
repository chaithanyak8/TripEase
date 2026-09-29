import { buildIndiaAttractions, findIndiaDestination } from '../../../shared/indiaTravelCatalog.js';

const categoryMap = {
  'tourist attractions': 'tourist_attraction',
  attraction: 'tourist_attraction',
  hotel: 'hotel',
  restaurants: 'restaurant',
  restaurant: 'restaurant',
  hospitals: 'hospital',
  hospital: 'hospital',
  police: 'police',
  pharmacy: 'pharmacy',
  pharmacies: 'pharmacy',
  fuel: 'fuel_station',
  'fuel stations': 'fuel_station',
  airports: 'airport',
  railway: 'railway_station',
  'railway stations': 'railway_station',
  bus: 'bus_station',
  'bus stations': 'bus_station',
  emergency: 'emergency_service',
  'emergency services': 'emergency_service'
};

export const getPlacesNearLocation = ({ latitude, longitude, radius = 5000, category = 'tourist attractions', destination = 'India' }) => {
  const normalizedCategory = categoryMap[category?.toLowerCase()] || categoryMap['tourist attractions'];
  const base = { latitude: Number(latitude) || 12.9716, longitude: Number(longitude) || 77.5946 };

  if (normalizedCategory !== 'tourist_attraction') {
    return {
      source: 'directory-unavailable',
      destination,
      category,
      radius,
      message: `Verified nearby ${category} listings are not connected for ${destination}. Use the official emergency numbers for urgent help.`,
      places: []
    };
  }

  const destinationRecord = findIndiaDestination(destination);
  if (!destinationRecord) {
    return { source: 'destination-not-found', destination, category, radius, places: [] };
  }
  const attractions = buildIndiaAttractions([destinationRecord]);
  const items = attractions.map((attraction, index) => ({
    id: attraction.id,
    name: attraction.name,
    category: attraction.category,
    latitude: attraction.coordinates.lat,
    longitude: attraction.coordinates.lng,
    address: `${attraction.city}, ${attraction.state}`,
    phone: 'Information unavailable',
    openStatus: 'Check current venue information',
    distanceKm: Number((0.8 + index * 1.1).toFixed(1)),
    source: 'destination catalog',
    description: attraction.description
  }));

  return {
    source: 'destination catalog',
    destination,
    category,
    radius,
    places: items.map((item) => ({
      ...item,
      distanceKm: Number(Math.min(radius / 1000, item.distanceKm)).toFixed(1)
    }))
  };
};

export const searchPlaces = ({ latitude, longitude, category, destination, q }) => {
  const results = getPlacesNearLocation({ latitude, longitude, category: category || 'tourist attractions', destination: destination || 'India' }).places;
  const query = String(q || '').trim().toLowerCase();

  if (!query) return results;
  return results.filter((place) => [
    place.name,
    place.category,
    place.address
  ].join(' ').toLowerCase().includes(query));
};
