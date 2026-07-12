/**
 * api.ts — Centralised fetch client for TransitOps
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'transit_token';

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token: string): void { localStorage.setItem(TOKEN_KEY, token); }
export function clearToken(): void { localStorage.removeItem(TOKEN_KEY); }

export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(title);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  let body: any;
  try { body = await res.json(); } catch { body = {}; }

  if (!res.ok) {
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(body.errors)) {
      for (const e of body.errors) {
        if (e.field) fieldErrors[e.field] = e.message;
      }
    }
    throw new ApiError(res.status, body.title ?? 'Request failed', body.detail ?? `HTTP ${res.status}`, fieldErrors);
  }
  return body as T;
}

// -- Auth
export interface ApiUser { id: string; name: string; email: string; role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'; }
export interface LoginResponse { token: string; user: ApiUser; }

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  return data;
}
export async function apiRegister(name: string, email: string, password: string, role: ApiUser['role']) {
  const user = await apiFetch<ApiUser>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) });
  await apiLogin(email, password);
  return user;
}
export async function apiGetMe() { return apiFetch<ApiUser>('/auth/me'); }

// -- Dashboard
export interface KpiData { activeVehicles: number; availableVehicles: number; vehiclesInMaintenance: number; activeTrips: number; pendingTrips: number; driversOnDuty: number; fleetUtilizationPct: number; }
export async function apiGetKpis() { return apiFetch<KpiData>('/dashboard/kpis'); }

// -- Vehicles
export interface ApiVehicle { id: string; registrationNumber: string; name: string; type: string; maxLoadCapacity: number; odometer: number; acquisitionCost: number; status: string; }
export async function apiGetVehicles(status?: string, type?: string) {
  const q = new URLSearchParams();
  if (status) q.append('status', status);
  if (type) q.append('type', type);
  return apiFetch<ApiVehicle[]>(`/vehicles?${q.toString()}`);
}
export async function apiGetAvailableVehicles() { return apiFetch<ApiVehicle[]>('/vehicles/available'); }
export async function apiCreateVehicle(data: Partial<ApiVehicle>) { return apiFetch<ApiVehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiUpdateVehicle(id: string, data: Partial<ApiVehicle>) { return apiFetch<ApiVehicle>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function apiRetireVehicle(id: string) { return apiFetch<void>(`/vehicles/${id}`, { method: 'DELETE' }); }

// -- Drivers
export interface ApiDriver { id: string; name: string; licenseNumber: string; licenseCategory: string; licenseExpiryDate: string; contactNumber: string; safetyScore: number; status: string; }
export async function apiGetDrivers(status?: string) {
  const q = new URLSearchParams();
  if (status) q.append('status', status);
  return apiFetch<ApiDriver[]>(`/drivers?${q.toString()}`);
}
export async function apiGetAvailableDrivers() { return apiFetch<ApiDriver[]>('/drivers/available'); }
export async function apiCreateDriver(data: Partial<ApiDriver>) { return apiFetch<ApiDriver>('/drivers', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiUpdateDriver(id: string, data: Partial<ApiDriver>) { return apiFetch<ApiDriver>(`/drivers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function apiSuspendDriver(id: string) { return apiFetch<ApiDriver>(`/drivers/${id}/suspend`, { method: 'POST' }); }

// -- Trips
export interface ApiTrip { id: string; source: string; destination: string; cargoWeight: number; plannedDistance: number; finalOdometer?: number | null; fuelConsumed?: number | null; status: string; createdAt: string; vehicleId: string; driverId: string; vehicle?: ApiVehicle; driver?: ApiDriver; }
export async function apiGetTrips(status?: string) {
  const q = new URLSearchParams();
  if (status) q.append('status', status);
  return apiFetch<ApiTrip[]>(`/trips?${q.toString()}`);
}
export async function apiCreateTrip(data: Partial<ApiTrip>) { return apiFetch<ApiTrip>('/trips', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiDispatchTrip(id: string) { return apiFetch<ApiTrip>(`/trips/${id}/dispatch`, { method: 'POST' }); }
export async function apiCompleteTrip(id: string, finalOdometer: number, fuelConsumed: number) { return apiFetch<ApiTrip>(`/trips/${id}/complete`, { method: 'POST', body: JSON.stringify({ finalOdometer, fuelConsumed }) }); }
export async function apiCancelTrip(id: string) { return apiFetch<ApiTrip>(`/trips/${id}/cancel`, { method: 'POST' }); }

// -- Maintenance
export interface ApiMaintenanceLog { id: string; vehicleId: string; description: string; cost: number; isActive: boolean; createdAt: string; vehicle?: ApiVehicle; }
export async function apiGetMaintenanceLogs(vehicleId?: string) {
  const q = new URLSearchParams();
  if (vehicleId) q.append('vehicleId', vehicleId);
  return apiFetch<ApiMaintenanceLog[]>(`/maintenance?${q.toString()}`);
}
export async function apiCreateMaintenance(data: Partial<ApiMaintenanceLog>) { return apiFetch<ApiMaintenanceLog>('/maintenance', { method: 'POST', body: JSON.stringify(data) }); }
export async function apiCloseMaintenance(id: string) { return apiFetch<ApiMaintenanceLog>(`/maintenance/${id}/close`, { method: 'POST' }); }

// -- Fuel Logs
export interface ApiFuelLog { id: string; vehicleId: string; liters: number; cost: number; date: string; vehicle?: ApiVehicle; }
export async function apiGetFuelLogs(vehicleId?: string) {
  const q = new URLSearchParams();
  if (vehicleId) q.append('vehicleId', vehicleId);
  return apiFetch<ApiFuelLog[]>(`/fuel-logs?${q.toString()}`);
}
export async function apiCreateFuelLog(data: Partial<ApiFuelLog>) { return apiFetch<ApiFuelLog>('/fuel-logs', { method: 'POST', body: JSON.stringify(data) }); }

// -- Expenses
export interface ApiExpense { id: string; vehicleId: string; type: string; amount: number; date: string; vehicle?: ApiVehicle; }
export async function apiGetExpenses(vehicleId?: string) {
  const q = new URLSearchParams();
  if (vehicleId) q.append('vehicleId', vehicleId);
  return apiFetch<ApiExpense[]>(`/expenses?${q.toString()}`);
}
export async function apiCreateExpense(data: Partial<ApiExpense>) { return apiFetch<ApiExpense>('/expenses', { method: 'POST', body: JSON.stringify(data) }); }
