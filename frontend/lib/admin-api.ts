const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function saveToken(t: string) {
  if (typeof window !== "undefined") localStorage.setItem("admin_token", t);
}

export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem("admin_token");
}

export function hasToken(): boolean {
  return Boolean(getToken());
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Booking {
  id: number;
  service_id: number;
  vehicle_class_id: number;
  service_date: string;
  contact: string;
  comment: string | null;
  status: string;
  estimated_price: number | null;
  actual_price: number | null;
  executor: "owner" | "hired" | null;
  owner_earnings: number | null;
  created_at: string;
}

export interface AdminService {
  id: number;
  name: string;
  description: string | null;
  price_from: number | null;
  is_active: boolean;
}

export interface AdminVehicleClass {
  id: number;
  name: string;
  description: string | null;
  price_multiplier: number;
  is_active: boolean;
}

export interface AdminReview {
  id: number;
  author_name: string | null;
  rating: number;
  text: string;
  is_approved: boolean;
  created_at: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const adminLogin = (username: string, password: string) =>
  request<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

// ── Bookings ──────────────────────────────────────────────────────────────────

export const adminGetBookings = (status?: string, limit = 200) =>
  request<Booking[]>(
    `/api/admin/booking-requests?limit=${limit}${status ? `&status=${status}` : ""}`
  );

export const adminUpdateStatus = (id: number, status: string) =>
  request<Booking>(`/api/admin/booking-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const adminUpdateAssignment = (id: number, executor: string, actual_price: number) =>
  request<Booking>(`/api/admin/booking-requests/${id}/assignment`, {
    method: "PATCH",
    body: JSON.stringify({ executor, actual_price }),
  });

// ── Services ──────────────────────────────────────────────────────────────────

export const adminGetServices = () => request<AdminService[]>("/api/admin/services");

export const adminUpdateServicePrice = (id: number, price_from: number) =>
  request<AdminService>(`/api/admin/services/${id}/price`, {
    method: "PUT",
    body: JSON.stringify({ price_from }),
  });

// ── Vehicle classes ───────────────────────────────────────────────────────────

export const adminGetVehicleClasses = () =>
  request<AdminVehicleClass[]>("/api/admin/vehicle-classes");

export const adminUpdateMultiplier = (id: number, price_multiplier: number) =>
  request<AdminVehicleClass>(`/api/admin/vehicle-classes/${id}/multiplier`, {
    method: "PUT",
    body: JSON.stringify({ price_multiplier }),
  });

// ── Reviews ───────────────────────────────────────────────────────────────────

export const adminGetAllReviews = (limit = 200) =>
  request<AdminReview[]>(`/api/admin/service-reviews?limit=${limit}`);

export const adminApproveReview = (id: number) =>
  request<AdminReview>(`/api/admin/service-reviews/${id}/approve`, { method: "PUT" });

export const adminHideReview = (id: number) =>
  request<AdminReview>(`/api/admin/service-reviews/${id}/hide`, { method: "PUT" });

export const adminDeleteReview = (id: number) =>
  request<null>(`/api/admin/service-reviews/${id}`, { method: "DELETE" });
