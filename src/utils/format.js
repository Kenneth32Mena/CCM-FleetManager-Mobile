export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const REASON_LABELS = { ruta: 'Ruta', manual: 'Manual', ajuste: 'Ajuste', carga: 'Carga' };

export function pad2(value) {
  return String(value).padStart(2, '0');
}

export function isoWeekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

export function weekRangeLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
  const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
  const range = monday.getMonth() === friday.getMonth()
    ? `${MONTHS_SHORT[monday.getMonth()]} ${pad2(monday.getDate())} - ${pad2(friday.getDate())}`
    : `${MONTHS_SHORT[monday.getMonth()]} ${pad2(monday.getDate())} - ${MONTHS_SHORT[friday.getMonth()]} ${pad2(friday.getDate())}`;
  return `Semana ${isoWeekNumber(date)}: ${range} ${monday.getFullYear()}`;
}

export function formatShortDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function sortVehicles(list) {
  return [...list].sort((a, b) => {
    const activeDiff = (a.active === false ? 1 : 0) - (b.active === false ? 1 : 0);
    if (activeDiff !== 0) return activeDiff;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export function toDateInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function numberLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  return Number(value).toLocaleString('es-NI', { maximumFractionDigits: 3 });
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function originLabel(origin) {
  return origin === 'flota' ? 'Flota' : 'Individual';
}

export function optionalNumber(value) {
  return value === '' ? null : Number(value);
}

export function startOfWeek() {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function needsMileageUpdate(vehicle, routes) {
  if (vehicle.active === false) return false;
  const route = routes.find((item) => String(item.id) === String(vehicle.routeId));
  if (!route || !(Number(route.kilometersPerDay) > 0)) return false;
  if (!vehicle.lastMileageUpdate) return true;
  const last = new Date(vehicle.lastMileageUpdate);
  if (Number.isNaN(last.getTime())) return true;
  return last < startOfWeek();
}

export const WEEK_DAYS = [
  { key: 'lunes', label: 'Lun' },
  { key: 'martes', label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves', label: 'Jue' },
  { key: 'viernes', label: 'Vie' },
];
