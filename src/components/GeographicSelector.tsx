import React, { useEffect, useRef, useState } from "react";

export interface GeographicLocation {
  lat: number;
  lng: number;
  address: string;
}

declare global {
  interface Window {
    google?: any;
  }
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
  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  type MapStatus = "idle" | "loading" | "ready" | "error";

  const [location, setLocation] = useState<GeographicLocation>(initialLocation);
  const [radius, setRadius] = useState<number>(initialRadius);
  const [address, setAddress] = useState<string>(initialLocation.address);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>(
    googleMapsApiKey ? "loading" : "idle"
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setLocation((prev) => {
      const updated = { ...prev, address: value };
      onLocationChange(updated, radius);
      return updated;
    });
  };

  const geocodeViaGoogle = async (
    addressInput: string
  ): Promise<GeographicLocation | null> => {
    if (!window.google?.maps?.Geocoder) return null;

    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: addressInput },
        (results: any, status: any) => {
          if (status === "OK" && results?.[0]) {
            const geometry = results[0].geometry.location;
            resolve({
              lat: geometry.lat(),
              lng: geometry.lng(),
              address: results[0].formatted_address,
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // Geocoding function with Google Maps fallback to OpenStreetMap
  const geocodeAddress = async (
    addressInput: string
  ): Promise<GeographicLocation | null> => {
    try {
      setIsGeocoding(true);

      // Try Google Geocoder first if available
      const googleResult = await geocodeViaGoogle(addressInput);
      if (googleResult) {
        return googleResult;
      }

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
      setAddress(result.address);
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
        </div>
      </div>
    );
  };

  const loadGoogleMapsScript = () => {
    if (!googleMapsApiKey) return;

    if (window.google?.maps) {
      setMapStatus("ready");
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setMapStatus("ready"));
      existingScript.addEventListener("error", () => setMapStatus("error"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => setMapStatus("ready");
    script.onerror = () => setMapStatus("error");
    document.head.appendChild(script);
  };

  useEffect(() => {
    if (googleMapsApiKey) {
      loadGoogleMapsScript();
    }
  }, [googleMapsApiKey]);

  const getZoomFromRadius = (radiusInMiles: number) => {
    if (radiusInMiles <= 1) return 14;
    if (radiusInMiles <= 5) return 12;
    if (radiusInMiles <= 10) return 11;
    if (radiusInMiles <= 25) return 10;
    if (radiusInMiles <= 50) return 8;
    return 7;
  };

  useEffect(() => {
    if (mapStatus !== "ready" || !mapContainerRef.current) {
      return;
    }

    const maps = window.google?.maps;
    if (!maps) {
      setMapStatus("error");
      return;
    }

    const center = { lat: location.lat, lng: location.lng };

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapContainerRef.current, {
        center,
        zoom: getZoomFromRadius(radius),
        disableDefaultUI: true,
        zoomControl: true,
      });

      markerRef.current = new maps.Marker({
        position: center,
        map: mapRef.current,
        animation: maps.Animation.DROP,
      });

      circleRef.current = new maps.Circle({
        map: mapRef.current,
        center,
        radius: radius * 1609.34,
        strokeColor: "#2563EB",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#60A5FA",
        fillOpacity: 0.2,
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(getZoomFromRadius(radius));
      markerRef.current?.setPosition(center);
      circleRef.current?.setCenter(center);
      circleRef.current?.setRadius(radius * 1609.34);
    }
  }, [mapStatus, location, radius]);

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
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter city, state, or address"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
            onBlur={handleAddressSearch}
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
      </div>

      {/* Coverage Callout */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 font-semibold">
            Approximate Coverage
          </p>
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-100">
            ~{Math.round(Math.PI * radius * radius)} square miles
          </p>
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-200">
          Radius: {radius} miles
        </div>
      </div>

      {/* Map Visualization */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Geographic Coverage
        </label>
        <div className="relative">
          <div
            ref={mapContainerRef}
            className={`h-80 w-full rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden ${
              mapStatus === "ready" ? "block" : "hidden"
            }`}
          />

          {mapStatus !== "ready" && (
            <div className="relative">
              <SimpleMapView />

              {googleMapsApiKey && mapStatus === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/70">
                  <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200">
                    <span className="inline-flex h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading interactive map…</span>
                  </div>
                </div>
              )}

              {googleMapsApiKey && mapStatus === "error" && (
                <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    Unable to load Google Maps. Please verify your API key in
                    the environment configuration.
                  </div>
                </div>
              )}
            </div>
          )}

          {!googleMapsApiKey && (
            <div className="absolute top-2 right-2 px-3 py-1 bg-gray-900/70 text-white text-xs rounded shadow">
              Add a Google Maps API key for interactive coverage
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
