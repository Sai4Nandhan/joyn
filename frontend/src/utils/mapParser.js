/**
 * Utility to parse and validate Google Maps and Apple Maps URLs
 * and extract numerical coordinates [latitude, longitude].
 */

export async function parseMapUrl(rawUrl) {
  const url = (rawUrl || '').trim();
  if (!url) {
    return { success: false, error: 'Please enter a valid Google Maps or Apple Maps link.' };
  }

  // Basic URL format validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return { success: false, error: 'Invalid URL format. Please paste a valid web link.' };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isGoogle = hostname.includes('google.com') || hostname.includes('goo.gl') || hostname.includes('maps.app');
  const isApple = hostname.includes('apple.com') || hostname.includes('maps.apple');

  if (!isGoogle && !isApple) {
    return {
      success: false,
      error: 'Only Google Maps (maps.google.com, maps.app.goo.gl) and Apple Maps (maps.apple.com) links are supported.',
    };
  }

  const fullUrlString = parsedUrl.toString();

  // Pattern 1: @lat,lng (e.g. https://www.google.com/maps/place/.../@17.9784,79.5941,15z)
  const atMatch = fullUrlString.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoord(lat, lng)) {
      return { success: true, lat, lng, mapUrl: fullUrlString, source: 'google_maps_at' };
    }
  }

  // Pattern 2: ?q=lat,lng or ?ll=lat,lng or ?query=lat,lng or ?center=lat,lng
  const paramMatch = fullUrlString.match(/[?&](?:q|ll|query|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lng = parseFloat(paramMatch[2]);
    if (isValidCoord(lat, lng)) {
      return { success: true, lat, lng, mapUrl: fullUrlString, source: 'maps_param' };
    }
  }

  // Pattern 3: Extract query string for geocoding search fallback (e.g. ?q=Warangal+Telangana)
  const queryParam = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || parsedUrl.searchParams.get('address');
  if (queryParam) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParam)}&limit=1`, {
        headers: { 'User-Agent': 'JOYN-Activity-Platform/1.0' },
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;
        if (isValidCoord(lat, lng)) {
          return { success: true, lat, lng, displayName, mapUrl: fullUrlString, source: 'geocoded_query' };
        }
      }
    } catch {
      // Ignore network geocode error and fall through to friendly error
    }
  }

  // If no coordinates could be parsed/geocoded:
  return {
    success: false,
    error: "Couldn't determine the location from this link.",
    canSearch: true,
  };
}

function isValidCoord(lat, lng) {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
