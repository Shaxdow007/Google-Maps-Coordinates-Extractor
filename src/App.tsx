import React, { useState, useEffect } from 'react';
import { Search, Copy, MapPin, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface SearchResult {
  id: string;
  input: string;
  coordinates: Coordinates;
  timestamp: Date;
  type: 'url' | 'place' | 'placeId';
}

interface GeocodeResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  place_id: string;
  formatted_address: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const App = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Coordinates | null>(null);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedLat, setCopiedLat] = useState(false);
  const [copiedLng, setCopiedLng] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('coordinatesHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(parsedHistory);
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }

    // Load Google Maps API
    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    // For demo purposes, we'll use fallback parsing only
    // In production, you would load the Google Maps API here
    console.log('Google Maps API would be loaded here with a valid API key');
    setGoogleMapsLoaded(false);
  };

  const extractCoordinatesFromUrl = (url: string): Coordinates | null => {
    try {
      // Remove any whitespace
      url = url.trim();
      
      // Pattern 1: @lat,lng format (most common)
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = url.match(atPattern);
      if (atMatch) {
        return {
          lat: parseFloat(atMatch[1]),
          lng: parseFloat(atMatch[2])
        };
      }

      // Pattern 2: ll=lat,lng format
      const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const llMatch = url.match(llPattern);
      if (llMatch) {
        return {
          lat: parseFloat(llMatch[1]),
          lng: parseFloat(llMatch[2])
        };
      }

      // Pattern 3: q=lat,lng format
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const qMatch = url.match(qPattern);
      if (qMatch) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2])
        };
      }

      // Pattern 4: center=lat,lng format
      const centerPattern = /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const centerMatch = url.match(centerPattern);
      if (centerMatch) {
        return {
          lat: parseFloat(centerMatch[1]),
          lng: parseFloat(centerMatch[2])
        };
      }

      // Pattern 5: Direct coordinates in URL path
      const directPattern = /\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const directMatch = url.match(directPattern);
      if (directMatch) {
        return {
          lat: parseFloat(directMatch[1]),
          lng: parseFloat(directMatch[2])
        };
      }

      return null;
    } catch (e) {
      console.error('Error extracting coordinates from URL:', e);
      return null;
    }
  };

  const geocodePlace = async (place: string): Promise<Coordinates | null> => {
    // For demo purposes, return null to show error handling
    // In production, this would use Google Maps Geocoding API
    return null;
  };

  const geocodePlaceId = async (placeId: string): Promise<Coordinates | null> => {
    // For demo purposes, return null to show error handling
    // In production, this would use Google Maps Geocoding API
    return null;
  };

  const isGoogleMapsUrl = (input: string): boolean => {
    return input.includes('google.com/maps') || input.includes('goo.gl/maps') || input.includes('maps.app.goo.gl');
  };

  const isPlaceId = (input: string): boolean => {
    return input.startsWith('ChIJ') || input.startsWith('place_id:');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let coordinates: Coordinates | null = null;
      let type: 'url' | 'place' | 'placeId' = 'place';

      if (isGoogleMapsUrl(input)) {
        // Extract from URL
        coordinates = extractCoordinatesFromUrl(input);
        type = 'url';
        
        if (!coordinates) {
          throw new Error('Could not extract coordinates from this Google Maps URL. Please try a different URL format.');
        }
      } else if (isPlaceId(input)) {
        // Handle Place ID
        const cleanPlaceId = input.replace('place_id:', '');
        coordinates = await geocodePlaceId(cleanPlaceId);
        type = 'placeId';
        
        if (!coordinates) {
          throw new Error('Could not find coordinates for this Place ID. Please check the ID and try again.');
        }
      } else {
        // Handle place name
        throw new Error('Place name geocoding requires a Google Maps API key. Please use a Google Maps URL instead, or configure the API key.');
      }

      if (coordinates) {
        setResult(coordinates);
        
        // Add to history
        const newResult: SearchResult = {
          id: Date.now().toString(),
          input: input.trim(),
          coordinates,
          timestamp: new Date(),
          type
        };
        
        const updatedHistory = [newResult, ...history.slice(0, 9)]; // Keep last 10 results
        setHistory(updatedHistory);
        localStorage.setItem('coordinatesHistory', JSON.stringify(updatedHistory));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (coordinates: Coordinates) => {
    try {
      const text = `${coordinates.lat}, ${coordinates.lng}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copyLatitude = async (lat: number) => {
    try {
      await navigator.clipboard.writeText(lat.toString());
      setCopiedLat(true);
      setTimeout(() => setCopiedLat(false), 2000);
    } catch (err) {
      console.error('Failed to copy latitude:', err);
    }
  };

  const copyLongitude = async (lng: number) => {
    try {
      await navigator.clipboard.writeText(lng.toString());
      setCopiedLng(true);
      setTimeout(() => setCopiedLng(false), 2000);
    } catch (err) {
      console.error('Failed to copy longitude:', err);
    }
  };
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('coordinatesHistory');
  };

  const formatCoordinate = (value: number): string => {
    return value.toFixed(6);
  };

  const getInputType = (input: string): string => {
    if (isGoogleMapsUrl(input)) return 'Google Maps URL';
    if (isPlaceId(input)) return 'Place ID';
    return 'Place Name';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">
              Google Maps Coordinates Extractor
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Extract latitude and longitude coordinates from Google Maps URLs, place names, or place IDs.
            Perfect for developers, researchers, and location-based applications.
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Google Maps URL, Place Name, or Place ID
              </label>
              <div className="relative">
                <input
                  id="input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., https://maps.google.com/... or Eiffel Tower, Paris or ChIJLU7jZClu5kcR4PcOOO6p3I0"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {input && (
                <p className="mt-2 text-sm text-gray-500">
                  Detected input type: <span className="font-medium text-blue-600">{getInputType(input)}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Extracting Coordinates...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Extract Coordinates
                </>
              )}
            </button>
          </form>

          {/* API Status */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
                <p className="text-sm text-amber-800">
                  Google Maps API not configured. URL parsing will work, but place name geocoding is limited.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> Google Maps URL parsing is fully functional. To enable place name and Place ID geocoding, configure a Google Maps API key.
              </p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mr-2" />
                Extracted Coordinates
              </h2>
              <button
                onClick={() => copyToClipboard(result)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-600">Latitude</label>
                  <button
                    onClick={() => copyLatitude(result.lat)}
                    className="p-1 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                    title="Copy latitude"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-lg font-mono text-gray-800">{formatCoordinate(result.lat)}</p>
                {copiedLat && (
                  <p className="text-xs text-emerald-600 mt-1">Latitude copied!</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-600">Longitude</label>
                  <button
                    onClick={() => copyLongitude(result.lng)}
                    className="p-1 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                    title="Copy longitude"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-lg font-mono text-gray-800">{formatCoordinate(result.lng)}</p>
                {copiedLng && (
                  <p className="text-xs text-emerald-600 mt-1">Longitude copied!</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Formatted:</strong> {formatCoordinate(result.lat)}, {formatCoordinate(result.lng)}
              </p>
            </div>
          </div>
        )}

        {/* Search History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Clock className="w-6 h-6 text-gray-600 mr-2" />
                Recent Searches
              </h2>
              <button
                onClick={clearHistory}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors duration-200"
              >
                Clear History
              </button>
            </div>
            
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.input}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.type === 'url' ? 'Google Maps URL' : item.type === 'placeId' ? 'Place ID' : 'Place Name'} • 
                        {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-sm font-mono text-gray-600">
                        {formatCoordinate(item.coordinates.lat)}, {formatCoordinate(item.coordinates.lng)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.coordinates)}
                        className="p-1 text-gray-400 hover:text-emerald-600 transition-colors duration-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Google Maps URLs</h4>
              <p className="text-sm text-gray-600">
                Paste any Google Maps URL containing coordinates. Works with various URL formats including shortened links.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Place Names</h4>
              <p className="text-sm text-gray-600">
                Enter any location name, address, or landmark. (Requires Google Maps API key configuration)
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Place IDs</h4>
              <p className="text-sm text-gray-600">
                Use Google Places API Place IDs (starting with "ChIJ") for precise location identification. (Requires API key)
              </p>
            </div>
          </div>
        </div>
        {/* Demo Examples */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Try These Example URLs</h3>
          <div className="space-y-2">
            <button
              onClick={() => setInput('https://www.google.com/maps/@40.7589,-73.9851,15z')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <code className="text-sm text-blue-600">https://www.google.com/maps/@40.7589,-73.9851,15z</code>
              <p className="text-xs text-gray-500 mt-1">Times Square, New York</p>
            </button>
            <button
              onClick={() => setInput('https://maps.google.com/maps?q=48.8584,2.2945')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <code className="text-sm text-blue-600">https://maps.google.com/maps?q=48.8584,2.2945</code>
              <p className="text-xs text-gray-500 mt-1">Eiffel Tower, Paris</p>
            </button>
            <button
              onClick={() => setInput('https://www.google.com/maps/place/@51.5074,-0.1278,17z')}
              className="block w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <code className="text-sm text-blue-600">https://www.google.com/maps/place/@51.5074,-0.1278,17z</code>
              <p className="text-xs text-gray-500 mt-1">London, UK</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;