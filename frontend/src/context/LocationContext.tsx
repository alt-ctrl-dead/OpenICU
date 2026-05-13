import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "../lib/api";

interface LocationState {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface LocationCtx {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
  permissionStatus: "prompt" | "granted" | "denied" | "unknown";
  requestLocation: () => Promise<LocationState | null>;
}

const LocationContext = createContext<LocationCtx>({
  location: null,
  loading: false,
  error: null,
  permissionStatus: "unknown",
  requestLocation: async () => null,
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "unknown">("unknown");

  // Check permission on mount
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermissionStatus(result.state as any);
        result.addEventListener("change", () => {
          setPermissionStatus(result.state as any);
        });
      }).catch(() => {});
    }
  }, []);

  // Sync with backend if location changes
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && location) {
      api.auth.updateLocation(location.lat, location.lng).catch(() => {});
    }
  }, [location]);

  const requestLocation = useCallback(async (): Promise<LocationState | null> => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: LocationState = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          setPermissionStatus("granted");
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          let msg = "Unable to get your location";
          if (err.code === 1) {
            msg = "Location permission denied. Please enable it in your browser settings.";
            setPermissionStatus("denied");
          } else if (err.code === 2) {
            msg = "Location unavailable. Please try again.";
          } else if (err.code === 3) {
            msg = "Location request timed out.";
          }
          setError(msg);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, permissionStatus, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
