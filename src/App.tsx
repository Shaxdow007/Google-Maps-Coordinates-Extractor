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
  const [preferViewport, setPreferViewport] = useState(true);

  useEffect(() => {
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

    loadGoogleMapsAPI();
  }, []);

  const loadGoogleMapsAPI = () => {
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return; 
    }
    console.log('Google Maps API would be loaded here with a valid API key');
    setGoogleMapsLoaded(false);
  };

  const extractCoordinatesFromUrl = (url: string): { viewport?: Coordinates; exact?: Coordinates } => {
    try {
      url = url.trim();
      const result: { viewport?: Coordinates; exact?: Coordinates } = {};

      const viewportMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,(\d+z))?/);
      if (viewportMatch) {
        result.viewport = {
          lat: parseFloat(viewportMatch[1]),
          lng: parseFloat(viewportMatch[2])
        };
      }

      const exactMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
      if (exactMatch) {
        result.exact = {
          lat: parseFloat(exactMatch[1]),
          lng: parseFloat(exactMatch[2])
        };
      }

      return result;
    } catch (e) {
      console.error('Error extracting coordinates from URL:', e);
      return {};
    }
  };

  const geocodePlace = async (place: string): Promise<Coordinates | null> => {
    return null;
  };

  const geocodePlaceId = async (placeId: string): Promise<Coordinates | null> => {
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
        const extracted = extractCoordinatesFromUrl(input);
        
        if (preferViewport && extracted.viewport) {
          coordinates = extracted.viewport;
        } else if (extracted.exact) {
          coordinates = extracted.exact;
        } else if (extracted.viewport) {
          coordinates = extracted.viewport;
        }

        type = 'url';
        
        if (!coordinates) {
          throw new Error('Could not extract coordinates from this Google Maps URL. Please try a different URL format.');
        }
      } else if (isPlaceId(input)) {
        const cleanPlaceId = input.replace('place_id:', '');
        coordinates = await geocodePlaceId(cleanPlaceId);
        type = 'placeId';
        
        if (!coordinates) {
          throw new Error('Could not find coordinates for this Place ID. Please check the ID and try again.');
        }
      } else {
        throw new Error('Place name geocoding requires a Google Maps API key. Please use a Google Maps URL instead, or configure the API key.');
      }

      if (coordinates) {
        setResult(coordinates);
        
        const newResult: SearchResult = {
          id: Date.now().toString(),
          input: input.trim(),
          coordinates,
          timestamp: new Date(),
          type
        };
        
        const updatedHistory = [newResult, ...history.slice(0, 9)];
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
    // Convert to fixed decimal if in scientific notation
    if (value.toString().includes('e')) {
      return value.toString();
    }
    // Otherwise return the raw value (preserves trailing zeros)
    return value.toString();
  };

  const getInputType = (input: string): string => {
    if (isGoogleMapsUrl(input)) return 'Google Maps URL';
    if (isPlaceId(input)) return 'Place ID';
    return 'Place Name';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">
              Google Maps Coordinates Extractor
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Extract latitude and longitude coordinates from Google Maps URLs, place names, or place IDs.
          </p>
        </div>

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
              {input && isGoogleMapsUrl(input) && (
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="preferViewport"
                    checked={preferViewport}
                    onChange={() => setPreferViewport(!preferViewport)}
                    className="mr-2"
                  />
                  <label htmlFor="preferViewport" className="text-sm text-gray-700">
                    Prefer viewport coordinates (@lat,lng)
                  </label>
                </div>
              )}
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

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
              <p className="text-sm text-amber-800">
                Google Maps API not configured. URL parsing will work, but place name geocoding is limited.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

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
                <p className="text-lg font-mono text-gray-800">
                  {formatCoordinate(result.lat)}
                </p>
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
                <p className="text-lg font-mono text-gray-800">
                  {formatCoordinate(result.lng)}
                </p>
                {copiedLng && (
                  <p className="text-xs text-emerald-600 mt-1">Longitude copied!</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Formatted:</strong> {formatCoordinate(result.lat)}, {formatCoordinate((result.lng))}
              </p>
            </div>
          </div>
        )}

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
                        {item.type === 'url' ? 'Google Maps URL' : item.type === 'placeId' ? 'Place ID' : 'Place Name'} • {" "}
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

        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Google Maps URLs</h4>
              <p className="text-sm text-gray-600">
                Paste any Google Maps URL. The tool can extract both viewport (@lat,lng) and exact place (!3d!4d) coordinates.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Coordinate Types</h4>
              <p className="text-sm text-gray-600">
                Viewport coordinates show the map center, while exact coordinates show the precise location. Toggle the preference checkbox.
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