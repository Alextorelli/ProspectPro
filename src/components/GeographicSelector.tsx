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
  type MapsModules = {
    Map: typeof google.maps.Map;
    Marker: typeof google.maps.Marker;
    Circle: typeof google.maps.Circle;
    Geocoder: typeof google.maps.Geocoder;
  };

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapsApiRef = useRef<any>(window.google?.maps ?? null);
  const mapsModulesRef = useRef<MapsModules | null>(null);
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
    const modules = mapsModulesRef.current;
    if (!modules?.Geocoder) return null;

    return new Promise((resolve) => {
      const geocoder = new modules.Geocoder();
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

  const mapStatusStyles: Record<
    MapStatus,
    { label: string; className: string }
  > = {
    idle: {
      label: "Static preview",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    loading: {
      label: "Loading maps",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
    },
    ready: {
      label: "Live map",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
    },
    error: {
      label: "Fallback preview",
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
    },
  };

  const currentMapStatus = mapStatusStyles[mapStatus];

  useEffect(() => {
    if (!googleMapsApiKey) {
      mapsApiRef.current = null;
      mapsModulesRef.current = null;
      loaderPromiseRef.current = null;
      setMapStatus("idle");
      return;
    }

    setMapStatus("loading");

    let didCancel = false;

    const loadLibraries = async () => {
      try {
        setOptions({ key: googleMapsApiKey });

        const [{ Map, Circle }, { Marker }, { Geocoder }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("geocoding"),
        ]);

        if (didCancel) {
          return;
        }

        mapsApiRef.current = window.google?.maps ?? null;
        mapsModulesRef.current = {
          Map,
          Circle,
          Marker,
          Geocoder,
        };
        setMapStatus("ready");
      } catch (error) {
        if (didCancel) {
          return;
        }

        console.error("Google Maps load error:", error);
        mapsApiRef.current = null;
        mapsModulesRef.current = null;
        loaderPromiseRef.current = null;
        setMapStatus("error");
      }
    };

    loaderPromiseRef.current = loadLibraries();

    return () => {
      didCancel = true;
    };
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
    const modules = mapsModulesRef.current;

    if (!maps || !modules) {
      setMapStatus("error");
      return;
    }

    const center = { lat: location.lat, lng: location.lng };

    if (!mapRef.current) {
      mapRef.current = new modules.Map(mapContainerRef.current, {
        center,
        zoom: getZoomFromRadius(radius),
        disableDefaultUI: true,
        zoomControl: true,
      });

      markerRef.current = new modules.Marker({
        position: center,
        map: mapRef.current,
        animation: maps.Animation.DROP,
      });

      circleRef.current = new modules.Circle({
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,380px),1fr]">
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Primary Location
              </p>
              <label className="mt-1 block text-base font-semibold text-slate-900 dark:text-slate-100">
                Where should we focus discovery?
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-600 dark:bg-slate-900">
                  <svg
                    className="h-5 w-5 text-blue-500 dark:text-sky-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a6 6 0 00-6 6c0 4.08 4.2 9.07 5.36 10.47a.84.84 0 001.28 0C11.8 17.07 16 12.08 16 8a6 6 0 00-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    placeholder="Enter city, state, or address"
                    className="flex-1 border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddressSearch()
                    }
                    onBlur={handleAddressSearch}
                    aria-label="Location search input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  disabled={isGeocoding}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                  {isGeocoding ? "Searching…" : "Search"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Use a city, full address, or landmark. We’ll automatically match
                nearby businesses.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Search Radius
              </p>
              <label className="mt-1 block text-base font-semibold text-slate-900 dark:text-slate-100">
                How wide should we scan?
              </label>
              <div
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
                role="radiogroup"
                aria-label="Search radius in miles"
              >
                {radiusOptions.map((option) => {
                  const isSelected = radius === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleRadiusChange(option.value)}
                      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm dark:border-sky-400 dark:bg-sky-500"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Tip: 10–25 miles captures metro areas, 50+ miles is ideal for
                statewide searches.
              </p>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 shadow-sm dark:border-sky-500/30 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-900">
          <div className="relative z-10 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-sky-300">
              Approximate Coverage
            </p>
            <p className="text-2xl font-semibold text-blue-900 dark:text-slate-100">
              ~{Math.round(Math.PI * radius * radius)} square miles
            </p>
            <p className="text-sm text-blue-700 dark:text-sky-200">
              Radius: {radius} miles · {location.address}
            </p>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full border border-blue-200/70 bg-blue-200/40 dark:border-sky-500/40 dark:bg-sky-500/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-28 w-28 rounded-full border border-blue-100/60 bg-blue-100/30 dark:border-sky-500/20 dark:bg-sky-500/10" />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Geographic Coverage
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Visualize your target radius
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The preview updates instantly as you adjust the radius or address.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${currentMapStatus.className}`}
          >
            {currentMapStatus.label}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <div className="relative aspect-[4/3] w-full max-h-[360px]">
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
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
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
      </section>
    </div>
  );
};
