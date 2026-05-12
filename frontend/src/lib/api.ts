const API_BASE = "http://localhost:5001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("openicu_token");
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  caregiverName?: string | null;
  consentContact?: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface BedInventoryItem {
  id: number;
  bedType: string;
  totalBeds: number;
  availableBeds: number;
  ventilatorAvailable: boolean;
  status: string;
  lastUpdatedAt: string;
}

export interface HospitalData {
  id: number;
  name: string;
  shortName?: string;
  category: string;
  type: string;
  area: string;
  city: string;
  fullAddress: string;
  pincode?: string;
  landmark?: string;
  phone?: string;
  emergency?: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  totalBeds: number;
  icuBeds: number;
  verified: boolean;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  departments: string[];
  facilities: string[];
  timings: Record<string, string> | null;
  icu: number;
  ven: number;
  beds: number;
  status: string;
  updated: string;
  inventory: BedInventoryItem[];
}

export interface RecommendedHospital {
  id: number;
  name: string;
  area: string;
  fullAddress: string;
  phone?: string;
  emergency?: string;
  rating: number;
  reviewCount: number;
  latitude?: number;
  longitude?: number;
  availableBeds: number;
  totalBeds: number;
  bedStatus: string;
  lastUpdated: string;
  distanceKm: number | null;
  rank: number;
  aiReason: string;
}

export interface RecommendResponse {
  recommendations: RecommendedHospital[];
  aiReasoning: string;
  totalCandidates: number;
}

export interface ReservationData {
  id: number;
  reservationCode: string;
  userId: number;
  hospitalId: number;
  bedType: string;
  urgency: string;
  medicalSituation?: string;
  issueDescription?: string;
  status: string;
  expiresAt?: string;
  hospital: { name: string; area: string };
  createdAt: string;
}

export interface PaymentData {
  id: number;
  paymentCode: string;
  amount: number;
  method: string;
  status: string;
}

export interface AmbulanceProviderData {
  id: number;
  providerName: string;
  vehicleType: string;
  city: string;
  area: string;
  etaMinutes: number;
  status: string;
  phone?: string;
}

export interface AmbulanceRequestData {
  id: number;
  requestCode: string;
  purpose: string;
  ambulanceType: string;
  status: string;
  provider?: AmbulanceProviderData;
  pickupArea?: string;
  pickupAddress?: string;
}

export interface AuditEventData {
  id: number;
  eventType: string;
  actorType: string;
  message: string;
  createdAt: string;
}

export interface StatsData {
  liveHospitals: number;
  icuBedsTracked: number;
  availableIcuBeds: number;
  totalBedsAvailable: number;
  ambulancesNearby: number;
  avgResponseTime: string;
}

export const api = {
  auth: {
    signup: (data: { name: string; email: string; phone?: string; password: string; caregiverName?: string; consentContact?: boolean }) =>
      request<AuthResponse>("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
    login: (email: string, password: string) =>
      request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    me: () => request<AuthUser>("/api/auth/me"),
    updateLocation: (lat: number, lng: number) =>
      request<{ success: boolean }>("/api/auth/location", { method: "PATCH", body: JSON.stringify({ latitude: lat, longitude: lng }) }),
  },

  hospitals: {
    list: () => request<HospitalData[]>("/api/hospitals"),
    get: (id: number) => request<HospitalData>(`/api/hospitals/${id}`),
    sync: (hospitalId: number, beds: { bedType: string; availableBeds: number; totalBeds?: number; status?: string }[]) =>
      request<{ success: boolean }>("/api/hospitals/sync", { method: "POST", body: JSON.stringify({ hospitalId, beds }) }),
  },

  recommend: (data: { bedType: string; urgency?: string; medicalSituation?: string; patientLat?: number; patientLng?: number; description?: string }) =>
    request<RecommendResponse>("/api/recommend", { method: "POST", body: JSON.stringify(data) }),

  reservations: {
    create: (data: Record<string, unknown>) =>
      request<ReservationData>("/api/reservations", { method: "POST", body: JSON.stringify(data) }),
    get: (id: string | number) => request<ReservationData>(`/api/reservations/${id}`),
    updateStatus: (id: number, status: string) =>
      request<ReservationData>(`/api/reservations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  payments: {
    config: () => request<{ publishableKey: string }>("/api/payments/config"),
    createIntent: (data: { reservationId: number; amount?: number }) =>
      request<{ clientSecret: string; paymentIntentId: string; paymentId: number; amount: number }>("/api/payments/create-intent", { method: "POST", body: JSON.stringify(data) }),
    confirm: (data: { paymentIntentId: string; reservationId: number }) =>
      request<{ success: boolean; reservation: ReservationData }>("/api/payments/confirm", { method: "POST", body: JSON.stringify(data) }),
    mock: (data: { reservationId: number; amount?: number; method?: string }) =>
      request<{ payment: PaymentData; reservation: ReservationData }>("/api/payments/mock", { method: "POST", body: JSON.stringify(data) }),
  },

  ambulances: {
    list: () => request<AmbulanceProviderData[]>("/api/ambulances"),
    createRequest: (data: Record<string, unknown>) =>
      request<AmbulanceRequestData>("/api/ambulances/requests", { method: "POST", body: JSON.stringify(data) }),
    getRequest: (id: string | number) => request<AmbulanceRequestData>(`/api/ambulances/requests/${id}`),
    updateStatus: (id: number, status: string) =>
      request<AmbulanceRequestData>(`/api/ambulances/requests/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  audit: {
    list: (limit = 20) => request<AuditEventData[]>(`/api/audit?limit=${limit}`),
  },

  stats: {
    get: () => request<StatsData>("/api/stats"),
  },

  uploads: {
    metadata: (data: { reservationId: number; fileName: string; fileType?: string; uploadType: string }) =>
      request<{ id: number }>("/api/uploads/metadata", { method: "POST", body: JSON.stringify(data) }),
  },
};
