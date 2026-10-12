import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { reportActivity } from '../lib/useIdleTimeout';
import { colors, formatMileage, typography } from '../theme';
import { WEEK_DAYS, sortVehicles } from '../utils/format';
import AccountMenu from '../components/AccountMenu';
import AccountModal from '../components/AccountModal';
import AppModal from '../components/Modal';
import Button from '../components/Button';
import VehiculosScreen from './VehiculosScreen';
import CargaCombustibleScreen from './CargaCombustibleScreen';

export default function HomeScreen({ user, onSignOut }) {
  const [vehicles, setVehicles] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [fuelVersion, setFuelVersion] = useState(0);
  const [activeModule, setActiveModule] = useState('vehicles');
  const [accountOpen, setAccountOpen] = useState(false);
  const [weekTargetId, setWeekTargetId] = useState(null);
  const [workedDays, setWorkedDays] = useState([]);
  const [weekError, setWeekError] = useState('');
  const [weekSubmitting, setWeekSubmitting] = useState(false);

  const selectedVehicle = vehicles.find(({ id }) => id === selectedId) ?? vehicles[0];
  const weekTarget = vehicles.find(({ id }) => id === weekTargetId) ?? null;
  const weekRoute = weekTarget ? routes.find((route) => String(route.id) === String(weekTarget.routeId)) : null;
  const weekKilometersPerDay = weekRoute ? Number(weekRoute.kilometersPerDay) : null;
  const weekDailyValid = Number.isFinite(weekKilometersPerDay) && weekKilometersPerDay >= 0;
  const weekTotalKm = weekDailyValid ? weekKilometersPerDay * workedDays.length : 0;
  const weekBlockedReason = !weekTarget
    ? 'Selecciona un vehículo.'
    : weekTarget.active === false
      ? 'El vehículo está inactivo y no puede actualizarse.'
      : !weekRoute
        ? 'El vehículo no tiene una ruta fija asignada.'
        : !weekDailyValid
          ? 'La ruta no tiene kilómetros por día válidos.'
          : workedDays.length === 0
            ? 'Selecciona al menos un día trabajado.'
            : '';

  useEffect(() => {
    let alive = true;
    async function loadVehicles() {
      try {
        const [data, conductorData, routeData] = await Promise.all([
          api.listVehicles(),
          api.listConductors(),
          api.listRoutes(),
        ]);
        if (!alive) return;
        const sortedVehicles = sortVehicles(data);
        setVehicles(sortedVehicles);
        setConductors(conductorData);
        setRoutes(routeData);
        setSelectedId(sortedVehicles[0]?.id ?? null);
      } catch (queryError) {
        if (alive) setError(`No se pudieron cargar los vehículos: ${queryError.message}`);
      }
      if (alive) setIsLoading(false);
    }
    loadVehicles();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicle) {
      setHistory([]);
      return;
    }
    api.listVehicleFuelHistory(selectedVehicle.id).then(setHistory).catch(() => setHistory([]));
  }, [selectedVehicle?.id, fuelVersion]);

  function openWeekModal(vehicle) {
    setWeekError('');
    setWorkedDays([]);
    setWeekTargetId(vehicle.id);
  }

  function closeWeekModal() {
    setWeekTargetId(null);
    setWorkedDays([]);
    setWeekError('');
  }

  function toggleWorkedDay(day) {
    setWorkedDays((current) => (
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
    ));
  }

  async function submitWeekMileage() {
    setWeekError('');
    if (weekBlockedReason) {
      setWeekError(weekBlockedReason);
      return;
    }
    setWeekSubmitting(true);
    try {
      await api.advanceMileageByWorkedDays(weekTarget.id, workedDays);
      const data = await api.listVehicles();
      setVehicles(sortVehicles(data));
      if (selectedVehicle?.id === weekTarget.id) {
        setHistory(await api.listVehicleFuelHistory(weekTarget.id));
      }
      closeWeekModal();
    } catch (advanceError) {
      setWeekError(`No se pudo actualizar el kilometraje: ${advanceError.message}`);
    } finally {
      setWeekSubmitting(false);
    }
  }

  const totalMileage = useMemo(
    () => vehicles.reduce((total, vehicle) => total + vehicle.currentMileage, 0),
    [vehicles]
  );

  return (
    <View
      style={styles.screen}
      onStartShouldSetResponderCapture={() => {
        reportActivity();
        return false;
      }}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={typography.eyebrow}>CCM FleetManager</Text>
            <Text style={typography.h1}>Mi flota</Text>
          </View>
          <AccountMenu
            email={user.email}
            onOpenAccount={() => setAccountOpen(true)}
            onSignOut={onSignOut}
          />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tab, activeModule === 'vehicles' ? styles.tabActive : styles.tabIdle]}
            onPress={() => setActiveModule('vehicles')}
          >
            <Text style={[styles.tabText, activeModule === 'vehicles' ? styles.tabTextActive : styles.tabTextIdle]}>
              Gestión de flota
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.tab, activeModule === 'fuel' ? styles.tabActive : styles.tabIdle]}
            onPress={() => setActiveModule('fuel')}
          >
            <Text style={[styles.tabText, activeModule === 'fuel' ? styles.tabTextActive : styles.tabTextIdle]}>
              Gasolinera
            </Text>
          </TouchableOpacity>
        </View>

        {activeModule === 'fuel' && (
          <CargaCombustibleScreen
            vehicles={vehicles}
            routes={routes}
            onRequestMileageUpdate={openWeekModal}
            onFuelChanged={() => setFuelVersion((current) => current + 1)}
          />
        )}

        {activeModule === 'vehicles' && (
          <VehiculosScreen
            vehicles={vehicles}
            setVehicles={setVehicles}
            conductors={conductors}
            setConductors={setConductors}
            routes={routes}
            setRoutes={setRoutes}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selectedVehicle={selectedVehicle}
            history={history}
            setHistory={setHistory}
            isLoading={isLoading}
            error={error}
            setError={setError}
            totalMileage={totalMileage}
            onRequestWeekMileage={openWeekModal}
          />
        )}
      </ScrollView>

      <AppModal
        visible={Boolean(weekTarget)}
        onClose={closeWeekModal}
        eyebrow="Kilometraje semanal"
        title="Días trabajados"
      >
        <Text style={styles.modalText}>
          Selecciona los días de lunes a viernes que {weekTarget?.name} trabajó. Se sumarán{' '}
          {weekKilometersPerDay ?? 0} km por día según su ruta fija.
        </Text>

        <View style={styles.daysRow}>
          {WEEK_DAYS.map((day) => {
            const active = workedDays.includes(day.key);
            return (
              <TouchableOpacity
                key={day.key}
                activeOpacity={0.85}
                style={[styles.dayTab, active ? styles.dayTabActive : styles.dayTabIdle]}
                onPress={() => toggleWorkedDay(day.key)}
              >
                <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>{day.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Días seleccionados</Text>
            <Text style={styles.statValue}>{workedDays.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Kilometraje a sumar</Text>
            <Text style={styles.statValue}>+{formatMileage(weekTotalKm)} km</Text>
          </View>
        </View>

        {(weekError || weekBlockedReason) !== '' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{weekError || weekBlockedReason}</Text>
          </View>
        )}

        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={closeWeekModal} style={styles.modalAction}>Cancelar</Button>
          <Button
            variant="primary"
            onPress={submitWeekMileage}
            loading={weekSubmitting}
            disabled={Boolean(weekBlockedReason)}
            style={styles.modalAction}
          >
            Actualizar kilometraje
          </Button>
        </View>
      </AppModal>

      {accountOpen && (
        <AccountModal user={user} onClose={() => setAccountOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    padding: 18,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerText: {
    flexShrink: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabIdle: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderColor: colors.arctic,
    backgroundColor: colors.arctic,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
  },
  tabTextIdle: {
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.onArctic,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 18,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  dayTab: {
    flexGrow: 1,
    minWidth: 58,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayTabIdle: {
    borderColor: colors.borderField,
    backgroundColor: colors.abyss,
  },
  dayTabActive: {
    borderColor: colors.arctic,
    backgroundColor: colors.arctic,
  },
  dayTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  dayTabTextActive: {
    color: colors.onArctic,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 14,
  },
  statLabel: {
    fontSize: 13,
    color: '#8296a9',
  },
  statValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  warningCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    backgroundColor: colors.warnBg,
    padding: 16,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.warnText,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  modalAction: {
    flex: 1,
  },
});
