import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { colors, formatMileage, typography } from '../theme';
import { REASON_LABELS, formatShortDate, sortVehicles, toDateInput, weekRangeLabel } from '../utils/format';
import AppModal from '../components/Modal';
import Button from '../components/Button';
import Card from '../components/Card';
import Field from '../components/Field';
import Pill from '../components/Pill';
import Select from '../components/Select';

const emptyVehicle = {
  brand: '',
  model: '',
  alias: '',
  year: '',
  motor: '',
  plate: '',
  color: '',
  initialMileage: '0',
};

export default function VehiculosScreen({
  vehicles,
  setVehicles,
  conductors,
  setConductors,
  routes,
  setRoutes,
  selectedId,
  setSelectedId,
  selectedVehicle,
  history,
  setHistory,
  isLoading,
  error,
  setError,
  totalMileage,
  onRequestWeekMileage,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState(null);
  const [catalogModal, setCatalogModal] = useState(null);
  const [catalogForm, setCatalogForm] = useState({ name: '', phone: '', kilometersPerDay: '0' });
  const [actionModal, setActionModal] = useState(null);
  const [mileageValue, setMileageValue] = useState('');
  const [historyAction, setHistoryAction] = useState(null);
  const [historyForm, setHistoryForm] = useState({ mileage: '', reason: 'ruta', date: '' });
  const [historyError, setHistoryError] = useState('');
  const [historySubmitting, setHistorySubmitting] = useState(false);

  function conductorName(vehicle) {
    return conductors.find((conductor) => String(conductor.id) === String(vehicle.driverId))?.name
      || 'Sin conductor asignado';
  }

  function routeName(vehicle) {
    return routes.find((route) => String(route.id) === String(vehicle.routeId))?.name
      || 'Sin ruta asignada';
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyVehicle);
    setError('');
    setIsFormOpen(true);
  }

  function openEditForm(vehicle) {
    setEditingId(vehicle.id);
    setForm({
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      alias: vehicle.alias || vehicle.name || '',
      year: String(vehicle.year || ''),
      motor: vehicle.motor || '',
      plate: vehicle.plate || '',
      color: vehicle.color || '',
      initialMileage: String(vehicle.initialMileage ?? vehicle.currentMileage ?? 0),
      driverId: vehicle.driverId || '',
      routeId: vehicle.routeId || '',
    });
    setIsFormOpen(true);
  }

  async function saveVehicle() {
    setError('');
    if (!form.brand.trim() || !form.model.trim() || !form.alias.trim() || !form.year
      || !form.plate.trim() || !form.color.trim()) {
      setError('Completá los campos obligatorios: marca, modelo, alias, año, placa y color.');
      return;
    }
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      alias: form.alias.trim(),
      year: Number(form.year),
      motor: form.motor.trim() || null,
      plate: form.plate.trim().toUpperCase(),
      color: form.color.trim(),
      initialMileage: Number(form.initialMileage),
      driverId: form.driverId || null,
      routeId: form.routeId || null,
    };
    try {
      const vehicle = editingId
        ? await api.updateVehicle(editingId, payload)
        : await api.createVehicle(payload);
      setVehicles((current) => {
        const next = editingId
          ? current.map((item) => (item.id === vehicle.id ? vehicle : item))
          : [...current, vehicle];
        return sortVehicles(next);
      });
      setSelectedId(vehicle.id);
      setForm(emptyVehicle);
      setIsFormOpen(false);
    } catch (saveError) {
      setError(`No se pudo guardar el vehículo: ${saveError.message}`);
    }
  }

  function openMileageForm() {
    setMileageValue(String(selectedVehicle.currentMileage));
    setActionModal({ type: 'mileage' });
  }

  async function setSelectedMileage() {
    setError('');
    try {
      await api.updateMileage(selectedVehicle.id, Number(mileageValue));
      const data = await api.listVehicles();
      setVehicles(sortVehicles(data));
      setHistory(await api.listVehicleFuelHistory(selectedVehicle.id));
      setActionModal(null);
    } catch (mileageError) {
      setError(`No se pudo actualizar el odómetro: ${mileageError.message}`);
    }
  }

  function openHistoryEdit(entry) {
    setHistoryError('');
    setHistoryForm({
      mileage: String(entry.newMileage),
      reason: entry.reason || 'ruta',
      date: toDateInput(entry.date),
    });
    setHistoryAction({ type: 'edit', entry });
  }

  function openHistoryDelete(entry) {
    setHistoryError('');
    setHistoryAction({ type: 'delete', entry });
  }

  function closeHistoryModal() {
    setHistoryAction(null);
    setHistoryError('');
  }

  async function submitHistoryEdit() {
    setHistoryError('');
    setHistorySubmitting(true);
    try {
      await api.updateMileageHistoryEntry(selectedVehicle.id, historyAction.entry.id, {
        newMileage: Number(historyForm.mileage),
        reason: historyForm.reason,
        date: historyForm.date,
      });
      const data = await api.listVehicles();
      setVehicles(sortVehicles(data));
      setHistory(await api.listVehicleFuelHistory(selectedVehicle.id));
      closeHistoryModal();
    } catch (editError) {
      setHistoryError(editError.message);
    } finally {
      setHistorySubmitting(false);
    }
  }

  async function confirmHistoryDelete() {
    setHistoryError('');
    setHistorySubmitting(true);
    try {
      await api.deleteMileageHistoryEntry(selectedVehicle.id, historyAction.entry.id);
      const data = await api.listVehicles();
      setVehicles(sortVehicles(data));
      setHistory(await api.listVehicleFuelHistory(selectedVehicle.id));
      closeHistoryModal();
    } catch (deleteError) {
      setHistoryError(deleteError.message);
    } finally {
      setHistorySubmitting(false);
    }
  }

  function removeSelectedVehicle() {
    setActionModal({ type: 'delete' });
  }

  async function confirmRemoveSelectedVehicle() {
    try {
      await api.deleteVehicle(selectedVehicle.id);
      const data = await api.listVehicles();
      const sortedVehicles = sortVehicles(data);
      setVehicles(sortedVehicles);
      setSelectedId(sortedVehicles[0]?.id ?? null);
      setActionModal(null);
    } catch (deleteError) {
      setError(`No se pudo eliminar el vehículo: ${deleteError.message}`);
    }
  }

  function toggleVehicle(vehicle) {
    const nextActive = vehicle.active === false;
    setActionModal({ type: 'toggle', vehicle, nextActive });
  }

  async function confirmToggleVehicle() {
    const { vehicle, nextActive } = actionModal;
    const action = nextActive ? 'activar' : 'desactivar';
    try {
      const updated = await api.setVehicleActive(vehicle.id, nextActive);
      setVehicles((current) => sortVehicles(current.map((entry) => (entry.id === updated.id ? updated : entry))));
      setActionModal(null);
    } catch (statusError) {
      setError(`No se pudo ${action} el vehículo: ${statusError.message}`);
    }
  }

  function openConductorForm(conductor = null) {
    setError('');
    setCatalogModal({ type: 'conductor', id: conductor?.id || null });
    setCatalogForm({ name: conductor?.name || '', phone: conductor?.phone || '', kilometersPerDay: '0' });
  }

  function openRouteForm(route = null) {
    setError('');
    setCatalogModal({ type: 'route', id: route?.id || null });
    setCatalogForm({ name: route?.name || '', phone: '', kilometersPerDay: String(route?.kilometersPerDay ?? '0') });
  }

  async function saveCatalog() {
    setError('');
    if (!catalogForm.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    try {
      if (catalogModal.type === 'conductor') {
        const payload = { name: catalogForm.name.trim(), phone: catalogForm.phone.trim() || null };
        const saved = catalogModal.id
          ? await api.updateConductor(catalogModal.id, payload)
          : await api.createConductor(payload);
        setConductors((current) => {
          const next = catalogModal.id
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [...current, saved];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      } else {
        const payload = {
          name: catalogForm.name.trim(),
          kilometersPerDay: Number(catalogForm.kilometersPerDay),
        };
        const saved = catalogModal.id
          ? await api.updateRoute(catalogModal.id, payload)
          : await api.createRoute(payload);
        setRoutes((current) => {
          const next = catalogModal.id
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [...current, saved];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      setCatalogModal(null);
    } catch (catalogError) {
      setError(`No se pudo guardar el catálogo: ${catalogError.message}`);
    }
  }

  function deactivateCatalog(type, item) {
    const label = type === 'conductor' ? 'conductor' : 'ruta';
    setActionModal({ type: 'catalog-deactivate', catalogType: type, item, label });
  }

  async function confirmDeactivateCatalog() {
    const { catalogType, item, label } = actionModal;
    try {
      if (catalogType === 'conductor') {
        await api.deleteConductor(item.id);
        setConductors((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        await api.deleteRoute(item.id);
        setRoutes((current) => current.filter((entry) => entry.id !== item.id));
      }
      setActionModal(null);
    } catch (catalogError) {
      setError(`No se pudo desactivar ${label}: ${catalogError.message}`);
    }
  }

  const conductorOptions = [
    { label: 'Sin conductor asignado', value: '' },
    ...conductors.map((conductor) => ({ label: conductor.name, value: conductor.id })),
  ];
  const routeOptions = [
    { label: 'Sin ruta asignada', value: '' },
    ...routes.map((route) => ({ label: `${route.name} (${route.kilometersPerDay} km/día)`, value: route.id })),
  ];
  const reasonOptions = Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <View>
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}
      {isLoading && <Text style={styles.loadingText}>Cargando vehículos...</Text>}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={typography.eyebrow}>Vehículos registrados</Text>
          <Text style={styles.statValue}>{vehicles.length}</Text>
          <Text style={styles.statCaption}>Unidades en el sistema</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.eyebrow}>Kilometraje acumulado</Text>
          <Text style={styles.statValue}>
            {formatMileage(totalMileage)} <Text style={styles.statUnit}>km</Text>
          </Text>
          <Text style={styles.statCaption}>Odómetro virtual de la flota</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={typography.eyebrow}>Servicios registrados</Text>
          <Text style={styles.statValue}>{vehicles.filter((vehicle) => vehicle.routeId).length}</Text>
          <Text style={styles.statCaption}>Unidades con ruta asignada</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={typography.eyebrow}>Vehículos</Text>
            <Text style={typography.h2}>Selecciona una unidad</Text>
          </View>
          <View style={styles.sectionHeaderActions}>
            <Text style={styles.count}>{vehicles.length} registrados</Text>
            <Button variant="primary" onPress={openCreateForm}>+ Registrar vehículo</Button>
          </View>
        </View>

        <View style={styles.split}>
          <ScrollView style={styles.vehicleList} nestedScrollEnabled>
            {vehicles.map((vehicle) => {
              const selected = vehicle.id === selectedId;
              return (
                <TouchableOpacity
                  key={vehicle.id}
                  activeOpacity={0.8}
                  style={[styles.vehicleItem, selected && styles.vehicleItemActive]}
                  onPress={() => setSelectedId(vehicle.id)}
                >
                  <View style={styles.vehicleIcon}>
                    <Text style={styles.vehicleIconText}>▣</Text>
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleMeta}>{vehicle.plate} · {vehicle.year}</Text>
                    <Text style={styles.vehicleMeta}>Conductor: {conductorName(vehicle)}</Text>
                    <Text style={styles.vehicleMeta}>Ruta: {routeName(vehicle)}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.toggle, vehicle.active === false ? styles.toggleOff : styles.toggleOn]}
                    onPress={() => toggleVehicle(vehicle)}
                  >
                    <Text style={[styles.toggleText, vehicle.active === false ? styles.toggleTextOff : styles.toggleTextOn]}>
                      {vehicle.active === false ? 'Inactivo' : 'Activo'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedVehicle && (
            <Card style={styles.detail}>
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderText}>
                  <Text style={typography.eyebrow}>Vehículo seleccionado</Text>
                  <Text style={typography.h2}>{selectedVehicle.name}</Text>
                  <Text style={styles.detailMeta}>
                    {selectedVehicle.plate} · {selectedVehicle.year} · {selectedVehicle.color}
                  </Text>
                </View>
                <Pill active={selectedVehicle.active !== false}>
                  {selectedVehicle.active === false ? 'Inactivo' : 'Activo'}
                </Pill>
              </View>

              <View style={styles.buttonRow}>
                <Button
                  variant={selectedVehicle.active === false ? 'primary' : 'danger'}
                  onPress={() => toggleVehicle(selectedVehicle)}
                  style={styles.flexButton}
                >
                  {selectedVehicle.active === false ? 'Activar' : 'Desactivar'}
                </Button>
                <Button variant="secondary" onPress={() => openEditForm(selectedVehicle)} style={styles.flexButton}>
                  Editar
                </Button>
                <Button variant="primary" onPress={() => onRequestWeekMileage(selectedVehicle)} style={styles.flexButton}>
                  Actualizar kilometraje
                </Button>
              </View>

              <View style={styles.mileageBox}>
                <View>
                  <Text style={typography.eyebrow}>Kilometraje actual</Text>
                  <Text style={styles.mileageValue}>
                    {formatMileage(selectedVehicle.currentMileage)} <Text style={styles.mileageUnit}>km</Text>
                  </Text>
                </View>
                <View style={styles.mileageSide}>
                  <Text style={styles.mileageSideLabel}>Última actualización</Text>
                  <Text style={styles.mileageSideValue}>
                    +{formatMileage(selectedVehicle.currentMileage - selectedVehicle.previousMileage)} km
                  </Text>
                </View>
              </View>

              <View style={styles.specGrid}>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Conductor</Text>
                  <Text style={styles.specValue}>{conductorName(selectedVehicle)}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Ruta</Text>
                  <Text style={styles.specValue}>{routeName(selectedVehicle)}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Motor</Text>
                  <Text style={styles.specValue}>{selectedVehicle.motor || 'Pendiente'}</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Odómetro anterior</Text>
                  <Text style={styles.specValue}>{formatMileage(selectedVehicle.previousMileage)} km</Text>
                </View>
                <View style={styles.specCell}>
                  <Text style={styles.specLabel}>Color</Text>
                  <Text style={styles.specValue}>{selectedVehicle.color}</Text>
                </View>
              </View>

              <View style={styles.divider}>
                <Text style={typography.eyebrow}>Especificaciones</Text>
                <Text style={styles.specText}>{selectedVehicle.motor || 'Sin motor registrado'}</Text>
              </View>

              <View style={styles.buttonRow}>
                <Button variant="secondary" onPress={openMileageForm} style={styles.flexButton}>
                  Ajustar kilometraje
                </Button>
                <Button
                  variant={selectedVehicle.active === false ? 'primary' : 'danger'}
                  onPress={() => toggleVehicle(selectedVehicle)}
                  style={styles.flexButton}
                >
                  {selectedVehicle.active === false ? 'Activar' : 'Desactivar'}
                </Button>
                <Button variant="danger" onPress={removeSelectedVehicle} style={styles.flexButton}>
                  Eliminar
                </Button>
              </View>

              <View style={styles.divider}>
                <Text style={typography.eyebrow}>Historial</Text>
                {history.length === 0 ? (
                  <Text style={styles.emptyText}>Sin cargas de combustible registradas.</Text>
                ) : (
                  history.slice(0, 5).map((entry) => (
                    <View key={entry.id} style={styles.historyCard}>
                      <View style={styles.historyTop}>
                        <View style={styles.historyIcon}>
                          <Text style={styles.historyIconText}>⛽</Text>
                        </View>
                        <Text style={styles.historyDate}>{formatShortDate(entry.date)}</Text>
                      </View>
                      <Text style={styles.historyOdometer}>
                        {entry.odometer != null ? formatMileage(Number(entry.odometer)) : '—'}{' '}
                        <Text style={styles.historyOdometerUnit}>km</Text>
                      </Text>
                      <View style={styles.historyStats}>
                        <View style={styles.historyStat}>
                          <Text style={styles.historyStatValue}>{Number(entry.liters).toFixed(2)}</Text>
                          <Text style={styles.historyStatLabel}>litros</Text>
                        </View>
                        <View style={[styles.historyStat, styles.historyStatBorder]}>
                          <Text style={styles.historyStatValue}>C$ {Number(entry.amount).toFixed(2)}</Text>
                          <Text style={styles.historyStatLabel}>costo</Text>
                        </View>
                        <View style={[styles.historyStat, styles.historyStatBorder]}>
                          <Text style={[styles.historyStatValue, entry.kilometersPerLiter != null && styles.historyStatMint]}>
                            {entry.kilometersPerLiter != null ? `${Number(entry.kilometersPerLiter).toFixed(1)} km/L` : '—'}
                          </Text>
                          <Text style={styles.historyStatLabel}>km/L</Text>
                        </View>
                        <View style={[styles.historyStat, styles.historyStatBorder]}>
                          <Text style={styles.historyStatValue}>
                            {entry.costPerKilometer != null ? `C$ ${Number(entry.costPerKilometer).toFixed(2)}` : '—'}
                          </Text>
                          <Text style={styles.historyStatLabel}>C$/km</Text>
                        </View>
                      </View>
                      <View style={styles.historyActions}>
                        <TouchableOpacity style={styles.historyAction} onPress={() => openHistoryEdit(entry)}>
                          <Text style={styles.historyActionText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.historyActionDanger} onPress={() => openHistoryDelete(entry)}>
                          <Text style={styles.historyActionTextDanger}>Borrar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </Card>
          )}
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderText}>
            <Text style={typography.eyebrow}>Catálogos</Text>
            <Text style={typography.h2}>Conductores y rutas fijas</Text>
          </View>
          <View style={styles.sectionHeaderActions}>
            <Button variant="secondary" onPress={() => openConductorForm()}>Nuevo conductor</Button>
            <Button variant="secondary" onPress={() => openRouteForm()}>Nueva ruta</Button>
          </View>
        </View>

        <View style={styles.catalogsRow}>
          <View style={styles.catalogColumn}>
            <Text style={typography.eyebrow}>Conductores activos</Text>
            {conductors.length === 0 ? (
              <Text style={styles.emptyText}>No hay conductores registrados.</Text>
            ) : (
              conductors.map((conductor) => (
                <View key={conductor.id} style={styles.catalogItem}>
                  <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName}>{conductor.name}</Text>
                    <Text style={styles.catalogMeta}>{conductor.phone || 'Sin teléfono registrado'}</Text>
                  </View>
                  <View style={styles.catalogActions}>
                    <TouchableOpacity style={styles.actionPrimary} onPress={() => openConductorForm(conductor)}>
                      <Text style={styles.actionPrimaryText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionDanger} onPress={() => deactivateCatalog('conductor', conductor)}>
                      <Text style={styles.actionDangerText}>Desactivar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.catalogColumn}>
            <Text style={typography.eyebrow}>Rutas activas</Text>
            {routes.length === 0 ? (
              <Text style={styles.emptyText}>No hay rutas registradas.</Text>
            ) : (
              routes.map((route) => (
                <View key={route.id} style={styles.catalogItem}>
                  <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName}>{route.name}</Text>
                    <Text style={styles.catalogMeta}>{route.kilometersPerDay} km por día</Text>
                  </View>
                  <View style={styles.catalogActions}>
                    <TouchableOpacity style={styles.actionPrimary} onPress={() => openRouteForm(route)}>
                      <Text style={styles.actionPrimaryText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionDanger} onPress={() => deactivateCatalog('route', route)}>
                      <Text style={styles.actionDangerText}>Desactivar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </Card>

      <AppModal
        visible={Boolean(catalogModal)}
        onClose={() => setCatalogModal(null)}
        eyebrow={catalogModal?.id ? 'Editar catálogo' : 'Nuevo registro'}
        title={catalogModal?.type === 'conductor' ? 'Conductor' : 'Ruta fija'}
      >
        <Field
          label="Nombre"
          value={catalogForm.name}
          onChangeText={(value) => setCatalogForm((current) => ({ ...current, name: value }))}
          placeholder={catalogModal?.type === 'conductor' ? 'Nombre completo' : 'Ej. Centro - Norte'}
          required
        />
        {catalogModal?.type === 'conductor' ? (
          <Field
            label="Teléfono"
            value={catalogForm.phone}
            onChangeText={(value) => setCatalogForm((current) => ({ ...current, phone: value }))}
            placeholder="8888-8888"
            keyboardType="phone-pad"
          />
        ) : (
          <Field
            label="Kilómetros por día"
            value={catalogForm.kilometersPerDay}
            onChangeText={(value) => setCatalogForm((current) => ({ ...current, kilometersPerDay: value }))}
            keyboardType="numeric"
            required
          />
        )}
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setCatalogModal(null)} style={styles.modalAction}>Cancelar</Button>
          <Button variant="primary" onPress={saveCatalog} style={styles.modalAction}>
            {catalogModal?.id ? 'Guardar cambios' : 'Crear registro'}
          </Button>
        </View>
      </AppModal>

      <AppModal
        visible={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        eyebrow={editingId ? 'Actualizar unidad' : 'Nueva unidad'}
        title={editingId ? 'Editar vehículo' : 'Registrar vehículo'}
      >
        <ScrollView style={styles.formScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          <Field label="Marca" value={form.brand} onChangeText={(v) => updateForm('brand', v)} placeholder="Kia" required />
          <Field label="Modelo" value={form.model} onChangeText={(v) => updateForm('model', v)} placeholder="Combi" required />
          <Field label="Alias" value={form.alias} onChangeText={(v) => updateForm('alias', v)} placeholder="Kia Combi 03" required />
          <Field label="Año" value={form.year} onChangeText={(v) => updateForm('year', v)} placeholder="2002" keyboardType="numeric" required />
          <Field label="Motor" value={form.motor} onChangeText={(v) => updateForm('motor', v)} placeholder="2.4 gasolina" />
          <Field label="Placa" value={form.plate} onChangeText={(v) => updateForm('plate', v)} placeholder="M 00000" autoCapitalize="characters" required />
          <Field label="Color" value={form.color} onChangeText={(v) => updateForm('color', v)} placeholder="Blanco" required />
          <Field label="Kilometraje inicial" value={form.initialMileage} onChangeText={(v) => updateForm('initialMileage', v)} placeholder="0" keyboardType="numeric" required />
          <Select
            label="Conductor"
            value={form.driverId || ''}
            onChange={(value) => updateForm('driverId', value)}
            options={conductorOptions}
            placeholder="Sin conductor asignado"
            style={styles.fieldGap}
          />
          <Select
            label="Ruta fija"
            value={form.routeId || ''}
            onChange={(value) => updateForm('routeId', value)}
            options={routeOptions}
            placeholder="Sin ruta asignada"
            style={styles.fieldGap}
          />
        </ScrollView>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setIsFormOpen(false)} style={styles.modalAction}>Cancelar</Button>
          <Button variant="primary" onPress={saveVehicle} style={styles.modalAction}>
            {editingId ? 'Actualizar vehículo' : 'Guardar vehículo'}
          </Button>
        </View>
      </AppModal>

      <AppModal
        visible={actionModal?.type === 'mileage'}
        onClose={() => setActionModal(null)}
        eyebrow="Odómetro"
        title="Ajustar kilometraje"
      >
        <Text style={styles.modalText}>Actualiza el kilometraje actual de {selectedVehicle?.name}.</Text>
        <Field
          label="Kilometraje actual"
          value={mileageValue}
          onChangeText={setMileageValue}
          keyboardType="numeric"
          required
        />
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setActionModal(null)} style={styles.modalAction}>Cancelar</Button>
          <Button variant="primary" onPress={setSelectedMileage} style={styles.modalAction}>Guardar kilometraje</Button>
        </View>
      </AppModal>

      <AppModal
        visible={historyAction?.type === 'edit'}
        onClose={closeHistoryModal}
        eyebrow="Historial de kilometraje"
        title="Editar registro"
      >
        <Text style={styles.modalText}>
          {weekRangeLabel(historyAction?.entry?.date)} · {selectedVehicle?.name}
        </Text>
        <Field
          label="Kilometraje registrado"
          value={historyForm.mileage}
          onChangeText={(value) => setHistoryForm((current) => ({ ...current, mileage: value }))}
          keyboardType="numeric"
          required
        />
        <Field
          label="Fecha (AAAA-MM-DD)"
          value={historyForm.date}
          onChangeText={(value) => setHistoryForm((current) => ({ ...current, date: value }))}
          placeholder="2024-01-15"
          required
        />
        <Select
          label="Motivo"
          value={historyForm.reason}
          onChange={(value) => setHistoryForm((current) => ({ ...current, reason: value }))}
          options={reasonOptions}
          style={styles.fieldGap}
        />
        {historyError !== '' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{historyError}</Text>
          </View>
        )}
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={closeHistoryModal} style={styles.modalAction}>Cancelar</Button>
          <Button variant="primary" onPress={submitHistoryEdit} loading={historySubmitting} style={styles.modalAction}>
            Guardar cambios
          </Button>
        </View>
      </AppModal>

      <AppModal
        visible={historyAction?.type === 'delete'}
        onClose={closeHistoryModal}
        eyebrow="Historial de kilometraje"
        title="Eliminar registro"
      >
        <Text style={styles.modalText}>
          ¿Eliminar el registro {weekRangeLabel(historyAction?.entry?.date)} de {selectedVehicle?.name}?
          Se recalculará el odómetro del vehículo según los registros restantes.
        </Text>
        {historyError !== '' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{historyError}</Text>
          </View>
        )}
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={closeHistoryModal} style={styles.modalAction}>Cancelar</Button>
          <Button variant="danger" onPress={confirmHistoryDelete} loading={historySubmitting} style={styles.modalAction}>
            Eliminar registro
          </Button>
        </View>
      </AppModal>

      <AppModal
        visible={actionModal?.type === 'delete' || actionModal?.type === 'toggle' || actionModal?.type === 'catalog-deactivate'}
        onClose={() => setActionModal(null)}
        eyebrow="Confirmar acción"
        title={actionModal?.type === 'delete' ? 'Eliminar vehículo' : 'Cambiar estado'}
      >
        <Text style={styles.modalText}>
          {actionModal?.type === 'delete'
            ? `¿Eliminar ${selectedVehicle?.name}? Esta acción no se puede deshacer.`
            : actionModal?.type === 'toggle'
              ? `¿Deseas ${actionModal?.nextActive ? 'activar' : 'desactivar'} ${actionModal?.vehicle?.name}?`
              : `¿Desactivar ${actionModal?.label} "${actionModal?.item?.name}"? Ya no aparecerá para nuevas asignaciones.`}
        </Text>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={() => setActionModal(null)} style={styles.modalAction}>Cancelar</Button>
          <Button
            variant="danger"
            onPress={
              actionModal?.type === 'delete'
                ? confirmRemoveSelectedVehicle
                : actionModal?.type === 'toggle'
                  ? confirmToggleVehicle
                  : confirmDeactivateCatalog
            }
            style={styles.modalAction}
          >
            Confirmar
          </Button>
        </View>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginBottom: 12,
    fontSize: 14,
    color: colors.dangerText,
  },
  loadingText: {
    marginBottom: 12,
    fontSize: 14,
    color: colors.muted,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
  },
  statValue: {
    marginTop: 12,
    marginBottom: 5,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.7,
    color: colors.frost,
  },
  statUnit: {
    fontSize: 24,
    color: colors.arctic,
  },
  statCaption: {
    fontSize: 13,
    color: colors.faint,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  sectionHeaderText: {
    flexShrink: 1,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  count: {
    fontSize: 14,
    color: colors.muted,
  },
  split: {
    gap: 16,
  },
  vehicleList: {
    flexGrow: 0,
    marginBottom: 4,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 8,
  },
  vehicleItemActive: {
    borderColor: colors.arcticHoverStrong,
    backgroundColor: colors.arcticTint,
  },
  vehicleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.arcticTintStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIconText: {
    fontSize: 20,
    color: colors.arctic,
  },
  vehicleInfo: {
    flex: 1,
    minWidth: 0,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  vehicleMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
  },
  toggle: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  toggleOn: {
    borderColor: colors.mintBorder,
    backgroundColor: colors.mintBg,
  },
  toggleOff: {
    borderColor: colors.dangerBorderStrong,
    backgroundColor: colors.dangerBg,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toggleTextOn: {
    color: colors.mint,
  },
  toggleTextOff: {
    color: colors.inactiveText,
  },
  detail: {
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  detailHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  detailMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  flexButton: {
    flexGrow: 1,
    flexBasis: 130,
  },
  mileageBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 18,
    backgroundColor: colors.arcticTintStrong,
    padding: 20,
    marginBottom: 16,
  },
  mileageValue: {
    marginTop: 7,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -2.8,
    color: colors.frost,
  },
  mileageUnit: {
    fontSize: 28,
    color: colors.arctic,
  },
  mileageSide: {
    alignItems: 'flex-start',
  },
  mileageSideLabel: {
    fontSize: 13,
    color: '#8296a9',
  },
  mileageSideValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: '700',
    color: colors.mint,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.borderSoft,
    overflow: 'hidden',
    marginBottom: 4,
  },
  specCell: {
    width: '50%',
    backgroundColor: colors.surface,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
  },
  specLabel: {
    fontSize: 13,
    color: '#8296a9',
  },
  specValue: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 16,
    marginTop: 16,
  },
  specText: {
    marginTop: 7,
    fontSize: 15,
    color: colors.spec,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.muted,
  },
  historyCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: colors.mint,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    padding: 14,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.arcticTintStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 16,
  },
  historyDate: {
    fontSize: 13,
    color: colors.muted,
  },
  historyOdometer: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.7,
    color: colors.frost,
    marginBottom: 12,
  },
  historyOdometerUnit: {
    fontSize: 17,
    color: colors.muted,
  },
  historyStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
  },
  historyStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  historyStatBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSoft,
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.frost,
    textAlign: 'center',
  },
  historyStatMint: {
    color: colors.mint,
  },
  historyStatLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.muted,
  },
  historyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  historyAction: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.arcticBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  historyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.arctic,
  },
  historyActionDanger: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  historyActionTextDanger: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
  },
  catalogsRow: {
    gap: 20,
  },
  catalogColumn: {
    marginBottom: 8,
  },
  catalogItem: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    padding: 12,
  },
  catalogInfo: {
    flex: 1,
    minWidth: 0,
  },
  catalogName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  catalogMeta: {
    marginTop: 3,
    fontSize: 13,
    color: colors.muted,
  },
  catalogActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionPrimary: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.arcticBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.arctic,
  },
  actionDanger: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionDangerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
  },
  formScroll: {
    maxHeight: 380,
  },
  fieldGap: {
    marginTop: 4,
    marginBottom: 14,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 14,
  },
  warningCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    backgroundColor: colors.warnBg,
    padding: 14,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.warnText,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalAction: {
    flex: 1,
  },
});
