export const getNearbyEmergencyServices = ({ latitude, longitude, destination = 'India', radiusKm = 10 }) => {
  const baseLat = Number(latitude) || 12.9716;
  const baseLng = Number(longitude) || 77.5946;
  return {
    source: 'directory-unavailable',
    destination,
    center: { latitude: baseLat, longitude: baseLng },
    radiusKm,
    message: `Verified nearby service listings are not connected for ${destination}.`,
    emergencyNumbers: [
      { name: 'National Emergency', number: '112' },
      { name: 'Police', number: '100' },
      { name: 'Ambulance', number: '108' },
      { name: 'Fire', number: '101' },
      { name: 'Women’s Helpline', number: '1091' },
      { name: 'Tourist Helpline', number: '1363' }
    ],
    services: []
  };
};
