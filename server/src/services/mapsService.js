export const buildMapMarkers = ({ latitude, longitude, destination, places = [] }) => {
  const center = {
    latitude: Number(latitude) || 12.9716,
    longitude: Number(longitude) || 77.5946
  };

  const markers = [
    {
      id: 'destination-center',
      name: destination || 'Selected destination',
      category: 'destination',
      latitude: center.latitude,
      longitude: center.longitude,
      address: destination || 'Current destination'
    },
    ...places.map((place, index) => ({
      id: `place-${place.id || index}`,
      name: place.name,
      category: place.category || 'place',
      latitude: Number(place.latitude || center.latitude + (index % 5 - 2) * 0.006),
      longitude: Number(place.longitude || center.longitude + (index % 3 - 1) * 0.006),
      address: place.address || destination || 'Nearby location'
    }))
  ];

  return { center, markers };
};
