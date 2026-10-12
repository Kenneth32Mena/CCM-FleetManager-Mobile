import { supabase } from './supabase';
import { API_URL } from '../config';

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `Error ${response.status}: no se pudo completar la petición.`);
  }
  return body;
}

function normalizeVehicle(vehicle) {
  return {
    ...vehicle,
    name: vehicle.alias,
    specifications: vehicle.motor || 'Sin motor registrado',
    year: Number(vehicle.year),
    initialMileage: Number(vehicle.initialMileage),
    previousMileage: Number(vehicle.previousMileage),
    currentMileage: Number(vehicle.currentMileage),
    active: vehicle.active !== false,
    driver: vehicle.driverId ? `Conductor #${vehicle.driverId}` : 'Pendiente de asignar',
  };
}

export const api = {
  listVehicles: async () => (await request('/api/vehicles')).map(normalizeVehicle),
  createVehicle: async (vehicle) => normalizeVehicle(await request('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicle),
  })),
  updateVehicle: async (id, vehicle) => normalizeVehicle(await request(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicle),
  })),
  deleteVehicle: (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' }),
  setVehicleActive: (id, active) => request(`/api/vehicles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }).then(normalizeVehicle),
  advanceMileage: (id) => request(`/api/vehicles/${id}/kilometraje/avanzar`, { method: 'POST' }),
  advanceMileageByWorkedDays: (id, workedDays) => request(`/api/vehicles/${id}/kilometraje/dias`, {
    method: 'POST',
    body: JSON.stringify({ workedDays }),
  }),
  updateMileage: (id, mileage) => request(`/api/vehicles/${id}/kilometraje`, {
    method: 'PUT',
    body: JSON.stringify({ mileage }),
  }),
  listMileageHistory: (id) => request(`/api/vehicles/${id}/historial-kilometraje`),
  listVehicleFuelHistory: (id) => request(`/api/vehicles/${id}/historial-combustible`),
  updateMileageHistoryEntry: (vehicleId, entryId, payload) => request(`/api/vehicles/${vehicleId}/historial-kilometraje/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteMileageHistoryEntry: (vehicleId, entryId) => request(`/api/vehicles/${vehicleId}/historial-kilometraje/${entryId}`, {
    method: 'DELETE',
  }),
  listConductors: () => request('/api/conductores'),
  createConductor: (conductor) => request('/api/conductores', {
    method: 'POST',
    body: JSON.stringify(conductor),
  }),
  updateConductor: (id, conductor) => request(`/api/conductores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(conductor),
  }),
  deleteConductor: (id) => request(`/api/conductores/${id}`, { method: 'DELETE' }),
  listRoutes: () => request('/api/rutas'),
  createRoute: (route) => request('/api/rutas', {
    method: 'POST',
    body: JSON.stringify(route),
  }),
  updateRoute: (id, route) => request(`/api/rutas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(route),
  }),
  deleteRoute: (id) => request(`/api/rutas/${id}`, { method: 'DELETE' }),
  listFuelRecords: () => request('/api/combustible'),
  createFuelRecord: (record) => request('/api/combustible', {
    method: 'POST',
    body: JSON.stringify(record),
  }),
  updateFuelRecord: (id, payload) => request(`/api/combustible/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteFuelRecord: (id) => request(`/api/combustible/${id}`, { method: 'DELETE' }),
};
