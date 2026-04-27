const API_BASE =
  typeof window === "undefined"
    ? (process.env.BACKEND_URL ?? "http://127.0.0.1:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  is_active: boolean;
}

export interface VehicleClass {
  id: number;
  name: string;
  description: string | null;
  price_multiplier: number;
  is_active: boolean;
}

export interface PriceCalculation {
  service_id: number;
  vehicle_class_id: number;
  service_name: string;
  vehicle_class_name: string;
  base_price: number;
  price_multiplier: number;
  estimated_price: number;
  currency: string;
  disclaimer: string;
}

export interface BookingPayload {
  service_id: number;
  vehicle_class_id: number;
  service_date: string;
  contact: string;
  comment?: string | null;
  estimated_price?: number | null;
}

export interface BookingResponse {
  id: number;
  status: string;
  created_at: string;
}

export interface ServiceReview {
  id: number;
  author_name: string | null;
  rating: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

export interface ReviewPayload {
  author_name?: string | null;
  rating: number;
  text: string;
}

// ── Public API ───────────────────────────────────────────────────────────────

export const getServices = () =>
  request<Service[]>("/api/services");

export const getVehicleClasses = () =>
  request<VehicleClass[]>("/api/vehicle-classes");

export const calculatePrice = (payload: { service_id: number; vehicle_class_id: number }) =>
  request<PriceCalculation>("/api/calculate-booking-price", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createBooking = (payload: BookingPayload) =>
  request<BookingResponse>("/api/booking-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getServiceReviews = (limit = 20) =>
  request<ServiceReview[]>(`/api/service-reviews?limit=${limit}`);

export const createServiceReview = (payload: ReviewPayload) =>
  request<ServiceReview>("/api/service-reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
