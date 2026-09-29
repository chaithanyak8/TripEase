const buildWeatherFromCoordinates = ({ latitude, longitude, destination = 'your destination' }) => ({
  location: destination,
  temperatureC: 27,
  feelsLikeC: 29,
  condition: 'Partly cloudy',
  humidity: 68,
  windKph: 12,
  precipitationChance: 25,
  source: 'cached',
  message: 'Live weather temporarily unavailable'
});

export const getWeatherForLocation = async ({ latitude, longitude, destination }) => {
  const lat = Number(latitude) || 12.9716;
  const lon = Number(longitude) || 77.5946;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API unavailable');
    const data = await response.json();
    const current = data.current;
    const code = current?.weather_code;
    const codeMap = {
      0: 'Clear sky',
      1: 'Mostly clear',
      2: 'Partly cloudy',
      3: 'Cloudy',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      61: 'Rain',
      71: 'Snow',
      80: 'Rain showers',
      95: 'Thunderstorm'
    };

    return {
      location: destination || 'Selected destination',
      temperatureC: Math.round(current?.temperature_2m ?? 27),
      feelsLikeC: Math.round(current?.apparent_temperature ?? 29),
      condition: codeMap[code] || 'Partly cloudy',
      humidity: current?.relative_humidity_2m ?? 68,
      windKph: Math.round(current?.wind_speed_10m ?? 12),
      precipitationChance: 25,
      source: 'live',
      message: 'Live weather updated'
    };
  } catch (error) {
    return {
      ...buildWeatherFromCoordinates({ latitude: lat, longitude: lon, destination }),
      source: 'unavailable'
    };
  }
};
