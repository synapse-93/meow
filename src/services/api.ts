import axios from 'axios';
import type { PredictionResult, ForecastPoint, SimulationResult, LocationData } from '../store/useStore';

const getBackendUrl = () =>
  (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

function getBaseUrl() {
  return getBackendUrl();
}

export interface PredictRequest {
  latitude: number;
  longitude: number;
  date: string;
  time: string;
}

export interface SimulateRequest {
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  ndvi_override?: number;
  temperature_override?: number;
  building_density_override?: number;
}

export async function runPrediction(params: PredictRequest): Promise<PredictionResult> {
  const res = await api.post(`${getBaseUrl()}/api/predict`, params);
  return res.data;
}

export async function runForecast(
  location: LocationData,
  hours: number = 12
): Promise<ForecastPoint[]> {
  const now = new Date();
  const date = formatDate(now);
  const res = await api.post(`${getBaseUrl()}/api/forecast`, {
    latitude: location.lat,
    longitude: location.lng,
    date,
    hours,
  });
  return res.data.forecast;
}

export async function runSimulation(params: SimulateRequest): Promise<SimulationResult> {
  const res = await api.post(`${getBaseUrl()}/api/simulate`, params);
  return res.data;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

// Geocoding via Nominatim
export interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  name: string;
  address: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    county?: string;
  };
}

export async function searchLocations(query: string): Promise<GeoResult[]> {
  const res = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q: `${query}, Bengaluru, Karnataka, India`,
      format: 'json',
      limit: 6,
      addressdetails: 1,
      countrycodes: 'in',
    },
    headers: { 'Accept-Language': 'en' },
  });
  return res.data;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult | null> {
  try {
    const res = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', addressdetails: 1 },
      headers: { 'Accept-Language': 'en' },
    });
    return res.data;
  } catch {
    return null;
  }
}
