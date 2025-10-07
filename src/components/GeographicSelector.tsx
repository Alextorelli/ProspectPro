import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
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
  const mapsApiRef = useRef<any>(window.google?.maps ?? null);
  const loaderPromiseRef = useRef<Promise<void> | null>(null);

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
    const maps = mapsApiRef.current;
    if (!maps?.Geocoder) return null;

    return new Promise((resolve) => {
      const geocoder = new maps.Geocoder();
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
      return Math.min(radiusInMiles * 3.6, 160);
    };

    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-green-100 via-blue-50 to-blue-100">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-100 opacity-60" />

        <div className="absolute inset-0 opacity-20">
          {[...Array(6)].map((_, index) => (
            <div
              key={`h-${index}`}
              className="absolute border-t border-gray-400/70"
              style={{ top: `${index * 20}%`, width: "100%" }}
            />
          ))}
          {[...Array(8)].map((_, index) => (
            <div
              key={`v-${index}`}
              className="absolute border-l border-gray-400/70"
              style={{ left: `${index * 12.5}%`, height: "100%" }}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 border-dashed bg-blue-200/40"
            style={{
              width: `${getRadiusSize(radius)}px`,
              height: `${getRadiusSize(radius)}px`,
            }}
          />

          <div className="relative h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg">
            <div className="absolute left-1/2 top-full -ml-[2px] border-l-[2px] border-r-[2px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3 rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-gray-800 shadow-sm">
          {location.address}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!googleMapsApiKey) {
      mapsApiRef.current = null;
      loaderPromiseRef.current = null;
      setMapStatus("idle");
      return;
    }

    setMapStatus("loading");

    if (!loaderPromiseRef.current) {
      loaderPromiseRef.current = (async () => {
        setOptions({ key: googleMapsApiKey, libraries: ["places"] });
        await importLibrary("maps");
        await importLibrary("geocoding");
        await importLibrary("places");
      })();
    }

    loaderPromiseRef.current
      .then(() => {
        mapsApiRef.current = window.google?.maps ?? null;
        if (mapsApiRef.current) {
          setMapStatus("ready");
        } else {
          console.error("Google Maps API did not initialize as expected.");
          setMapStatus("error");
          loaderPromiseRef.current = null;
        }
      })
      .catch((error) => {
        console.error("Google Maps load error:", error);
        loaderPromiseRef.current = null;
        setMapStatus("error");
      });
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

    const maps = mapsApiRef.current;
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
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Geographic Coverage
          </label>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Preview adjusts as you refine the radius
          </span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <div className="relative aspect-[4/3] w-full max-h-[340px]">
            <div
              ref={mapContainerRef}
              className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
                mapStatus === "ready"
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            />

            {mapStatus !== "ready" && (
              <div className="absolute inset-0">
                <SimpleMapView />

                {googleMapsApiKey && mapStatus === "loading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      <span>Loading interactive map…</span>
                    </div>
                  </div>
                )}

                {googleMapsApiKey && mapStatus === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                      Unable to load Google Maps. Please verify your API key in
                      the environment configuration.
                    </div>
                  </div>
                )}
              </div>
            )}

            {!googleMapsApiKey && (
              <div className="absolute left-3 top-3 rounded-full bg-gray-900/70 px-3 py-1 text-xs font-semibold text-white shadow">
                Add a Google Maps API key for live coverage
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
