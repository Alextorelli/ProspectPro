import React, { useState } from "react";

export interface GeographicLocation {
  lat: number;
  lng: number;
  address: string;
}

interface GeographicSelectorProps {
  onLocationChange: (location: GeographicLocation, radius: number) => void;
  initialLocation?: GeographicLocation;
  initialRadius?: number;
}

export const GeographicSelector: React.FC<GeographicSelectorProps> = ({
  onLocationChange,
  initialLocation = { lat: 40.7128, lng: -74.006, address: "New York, NY" },
  initialRadius = 10,
}) => {
  const [location, setLocation] = useState<GeographicLocation>(initialLocation);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [address, setAddress] = useState<string>(initialLocation.address);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapType, setMapType] = useState<"simple" | "full">("simple");

  // Geocoding function using a free service
  const geocodeAddress = async (
    addressInput: string
  ): Promise<GeographicLocation | null> => {
    try {
      setIsGeocoding(true);

      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressInput
        )}&limit=1`
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
        };
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;

    const result = await geocodeAddress(address);
    if (result) {
      setLocation(result);
      onLocationChange(result, radius);
    } else {
      alert("Address not found. Please try a different address.");
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    onLocationChange(location, newRadius);
  };

  const radiusOptions = [
    { value: 1, label: "1 mile" },
    { value: 5, label: "5 miles" },
    { value: 10, label: "10 miles" },
    { value: 25, label: "25 miles" },
    { value: 50, label: "50 miles" },
    { value: 100, label: "100 miles" },
  ];

  // Simple map visualization using CSS
  const SimpleMapView: React.FC = () => {
    const getRadiusSize = (radiusInMiles: number) => {
      // Scale radius for visual representation (max 200px)
      return Math.min(radiusInMiles * 4, 200);
    };

    return (
      <div
        className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden border border-gray-300"
        style={{ height: "300px" }}
      >
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 opacity-50"></div>

        {/* Grid lines for map effect */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute border-t border-gray-400"
              style={{ top: `${i * 20}%`, width: "100%" }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute border-l border-gray-400"
              style={{ left: `${i * 12.5}%`, height: "100%" }}
            />
          ))}
        </div>

        {/* Center point */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ top: "50%", left: "50%" }}
        >
          {/* Radius circle */}
          <div
            className="absolute border-2 border-blue-500 border-dashed rounded-full bg-blue-200 bg-opacity-30 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${getRadiusSize(radius)}px`,
              height: `${getRadiusSize(radius)}px`,
            }}
          />

          {/* Location pin */}
          <div className="relative bg-red-500 rounded-full w-4 h-4 border-2 border-white shadow-lg">
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-500"></div>
          </div>
        </div>

        {/* Location info overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 rounded p-2">
          <div className="text-xs font-medium text-gray-800 truncate">
            {location.address}
          </div>
          <div className="text-xs text-gray-600">
            Radius: {radius} miles • Lat: {location.lat.toFixed(4)}, Lng:{" "}
            {location.lng.toFixed(4)}
          </div>
        </div>

        {/* Upgrade notice */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setMapType("full")}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            📍 Full Map
          </button>
        </div>
      </div>
    );
  };

  // Placeholder for full interactive map (would require Google Maps or Mapbox API)
  const FullMapView: React.FC = () => {
    return (
      <div
        className="relative bg-gray-100 rounded-lg border border-gray-300"
        style={{ height: "400px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Interactive Map
            </h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md">
              Full interactive map integration requires Google Maps or Mapbox
              API.
              <br />
              Add API keys to enable:
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div>• GOOGLE_MAPS_API_KEY</div>
              <div>• or MAPBOX_API_KEY</div>
            </div>
            <button
              onClick={() => setMapType("simple")}
              className="mt-4 px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
            >
              Back to Simple View
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter city, state, or address"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
          />
          <button
            onClick={handleAddressSearch}
            disabled={isGeocoding}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isGeocoding ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Radius Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Radius
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleRadiusChange(option.value)}
              className={`px-3 py-2 text-sm rounded-md border ${
                radius === option.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Custom radius slider */}
        <div className="mt-3">
          <input
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 mile</span>
            <span className="font-medium">{radius} miles</span>
            <span>100 miles</span>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Geographic Coverage
        </label>
        {mapType === "simple" ? <SimpleMapView /> : <FullMapView />}
      </div>

      {/* Coverage Summary */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Search Area:</strong> {radius}-mile radius around{" "}
          {location.address}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Approximate coverage: ~{Math.round(Math.PI * radius * radius)} square
          miles
        </div>
      </div>
    </div>
  );
};
