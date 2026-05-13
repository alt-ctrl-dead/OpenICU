import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";

const GOOGLE_MAPS_KEY = "AIzaSyDo2I1eiNYDv1AUfGR8vg8WTdXiN59C8RQ";

let mapsLoaded = false;
let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (mapsLoaded && (window as any).google?.maps) return Promise.resolve();
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      mapsLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      mapsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

// ── Static Hospital Map (shows a single hospital pin) ─────
export function HospitalMap({
  lat,
  lng,
  name,
  className = "",
}: {
  lat: number;
  lng: number;
  name: string;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current) return;
        const google = (window as any).google;
        const position = { lat, lng };

        const map = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: darkMapStyle,
        });

        new google.maps.Marker({
          position,
          map,
          title: name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#E50914",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: 10,
          },
        });

        // Info window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="color:#111;font-family:Inter,sans-serif;padding:4px 2px;">
            <strong style="font-size:13px;">${name}</strong>
            <div style="font-size:11px;color:#666;margin-top:2px;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          </div>`,
        });

        map.addListener("click", () => infoWindow.close());

        // Open info window by default
        const marker = new google.maps.Marker({
          position,
          map,
          title: name,
          visible: false,
        });
        infoWindow.open(map, marker);

        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [lat, lng, name]);

  if (error) {
    return (
      <div className={`rounded-xl bg-card border border-border flex items-center justify-center text-xs text-muted-foreground ${className}`} style={{ minHeight: 200 }}>
        <MapPin className="w-4 h-4 mr-2" /> Unable to load map
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`} style={{ minHeight: 200 }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 200 }} />
    </div>
  );
}

// ── Interactive Location Picker (user's live location + hospitals nearby) ──
export function LocationPickerMap({
  userLat,
  userLng,
  hospitals,
  onUserLocationChange,
  className = "",
}: {
  userLat?: number | null;
  userLng?: number | null;
  hospitals?: Array<{ lat: number; lng: number; name: string; beds: number }>;
  onUserLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current) return;
        const google = (window as any).google;

        const center = userLat && userLng
          ? { lat: userLat, lng: userLng }
          : { lat: 12.9716, lng: 77.5946 }; // Default: Bengaluru center

        const map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: darkMapStyle,
        });

        mapInstanceRef.current = map;

        // User location marker (blue pulsing dot)
        if (userLat && userLng) {
          addUserMarker(google, map, userLat, userLng);
        }

        // Hospital markers
        if (hospitals) {
          hospitals.forEach((h) => {
            const marker = new google.maps.Marker({
              position: { lat: h.lat, lng: h.lng },
              map,
              title: h.name,
              icon: {
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: "#E50914",
                fillOpacity: 0.9,
                strokeColor: "#fff",
                strokeWeight: 1.5,
                scale: 5,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `<div style="color:#111;font-family:Inter,sans-serif;padding:4px;">
                <strong style="font-size:12px;">${h.name}</strong>
                <div style="font-size:11px;color:#666;margin-top:2px;">🛏️ ${h.beds} beds available</div>
              </div>`,
            });
            marker.addListener("click", () => infoWindow.open(map, marker));
          });
        }

        // Click to set user location
        if (onUserLocationChange) {
          map.addListener("click", (e: any) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onUserLocationChange(lat, lng);

            // Move user marker
            if (userMarkerRef.current) {
              userMarkerRef.current.setPosition({ lat, lng });
            } else {
              addUserMarker(google, map, lat, lng);
            }
          });
        }

        setLoaded(true);
      })
      .catch(() => setError(true));
  }, []);

  // Update user marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current || !userLat || !userLng) return;
    const google = (window as any).google;
    if (!google) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setPosition({ lat: userLat, lng: userLng });
    } else {
      addUserMarker(google, mapInstanceRef.current, userLat, userLng);
    }
    mapInstanceRef.current.panTo({ lat: userLat, lng: userLng });
  }, [userLat, userLng]);

  function addUserMarker(google: any, map: any, lat: number, lng: number) {
    userMarkerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#3B82F6",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
        scale: 8,
      },
      zIndex: 999,
    });
  }

  if (error) {
    return (
      <div className={`rounded-xl bg-card border border-border flex items-center justify-center text-xs text-muted-foreground ${className}`} style={{ minHeight: 280 }}>
        <MapPin className="w-4 h-4 mr-2" /> Unable to load map
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`} style={{ minHeight: 280 }}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading map…</span>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 280 }} />
      {loaded && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 text-[10px] text-muted-foreground pointer-events-none">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-white" /> You</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#E50914] inline-block border border-white" /> Hospital</span>
          {onUserLocationChange && <span className="opacity-70">Tap map to set location</span>}
        </div>
      )}
    </div>
  );
}

// ── Dark map theme that matches OpenICU aesthetic ──
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a4e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4e4e6e" }] },
];
