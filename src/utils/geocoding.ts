// Helper function to get coordinates for Canadian cities
// In a production app, you could use the Google Geocoding API for dynamic lookups

interface CityCoordinates {
  latitude: number;
  longitude: number;
}

const CITY_COORDINATES: { [key: string]: CityCoordinates } = {
  // Major Canadian cities
  toronto: { latitude: 43.6532, longitude: -79.3832 },
  vancouver: { latitude: 49.2827, longitude: -123.1207 },
  montreal: { latitude: 45.5017, longitude: -73.5673 },
  calgary: { latitude: 51.0447, longitude: -114.0719 },
  ottawa: { latitude: 45.4215, longitude: -75.6972 },
  edmonton: { latitude: 53.5461, longitude: -113.4938 },
  winnipeg: { latitude: 49.8951, longitude: -97.1384 },
  quebec: { latitude: 46.8139, longitude: -71.208 },
  hamilton: { latitude: 43.2557, longitude: -79.8711 },
  kitchener: { latitude: 43.4516, longitude: -80.4925 },
  london: { latitude: 42.9849, longitude: -81.2453 },
  victoria: { latitude: 48.4284, longitude: -123.3656 },
  halifax: { latitude: 44.6488, longitude: -63.5752 },
  saskatoon: { latitude: 52.1332, longitude: -106.67 },
  regina: { latitude: 50.4452, longitude: -104.6189 },

  // Ontario
  mississauga: { latitude: 43.589, longitude: -79.6441 },
  brampton: { latitude: 43.7315, longitude: -79.7624 },
  markham: { latitude: 43.8561, longitude: -79.337 },
  oakville: { latitude: 43.4675, longitude: -79.6877 },
  burlington: { latitude: 43.3255, longitude: -79.799 },

  // BC
  surrey: { latitude: 49.1913, longitude: -122.849 },
  burnaby: { latitude: 49.2488, longitude: -122.9805 },
  richmond: { latitude: 49.1666, longitude: -123.1336 },

  // Alberta
  "red deer": { latitude: 52.2681, longitude: -113.8111 },
  lethbridge: { latitude: 49.6942, longitude: -112.8328 },
};

export const getCityCoordinates = (
  cityName: string
): CityCoordinates | null => {
  const normalizedCity = cityName.toLowerCase().trim();

  // Try exact match first
  if (CITY_COORDINATES[normalizedCity]) {
    return CITY_COORDINATES[normalizedCity];
  }

  // Try partial match (e.g., "Toronto, ON" -> "toronto")
  const cityPart = normalizedCity.split(",")[0].trim();
  if (CITY_COORDINATES[cityPart]) {
    return CITY_COORDINATES[cityPart];
  }

  return null;
};

export const getCityFromGeoId = (geoId: string): string => {
  // Extract city name from geo ID format (e.g., "toronto-on" -> "Toronto")
  const parts = geoId.split("-");
  if (parts.length > 0) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  return geoId;
};
