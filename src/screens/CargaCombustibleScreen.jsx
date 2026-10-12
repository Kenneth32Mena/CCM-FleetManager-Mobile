import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';
import { colors, typography } from '../theme';
import { formatDate, needsMileageUpdate, numberLabel, originLabel, optionalNumber } from '../utils/format';
import AppModal from '../components/Modal';
import Button from '../components/Button';
import Card from '../components/Card';
import Field from '../components/Field';
import Select from '../components/Select';

const emptyForm = { vehicleId: '', amount: '' };
const emptyFleetEntry = { vehicleId: '', pumpPrevious: '', pumpCurrent: '' };

export default function CargaCombustibleScreen({ vehicles, routes = [], onRequestMileageUpdate, onFuelChanged }) {
  const activeVehicles = vehicles.filter((vehicle) => vehicle.active !== false);
  const pendingVehicles = vehicles.filter((vehicle) => needsMileageUpdate(vehicle, routes));
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState('individual');
  const [fleetEntries, setFleetEntries] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fuelAction, setFuelAction] = useState(null);
  const [fuelForm, setFuelForm] = useState({ amount: '', date: '' });
  const [fuelSubmitting, setFuelSubmitting] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      setRecords(await api.listFuelRecords());
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setMessage('');
  }

  function addFleetEntry() {
    setFleetEntries((current) => [...current, {
      ...emptyFleetEntry,
      pumpPrevious: current.at(-1)?.pumpCurrent || '',
    }]);
  }

  function updateFleetEntry(index, key, value) {
    setFleetEntries((current) => {
      const next = current.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, [key]: value } : entry
      ));
      if (key === 'pumpCurrent' && next[index + 1]) {
        next[index + 1] = { ...next[index + 1], pumpPrevious: value };
      }
      return next;
    });
  }

  function removeFleetEntry(index) {
    setFleetEntries((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      if (index > 0 && next[index]) {
        next[index] = { ...next[index], pumpPrevious: next[index - 1].pumpCurrent || '' };
      }
      return next;
    });
  }

  function openFuelEdit(record) {
    const date = new Date(record.date);
    const pad = (value) => String(value).padStart(2, '0');
    const dateText = Number.isNaN(date.getTime())
      ? ''
      : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    setFuelForm({ amount: String(record.amount), date: dateText });
    setFuelAction({ type: 'edit', record });
    setError('');
  }

  function openFuelDelete(record) {
    setFuelAction({ type: 'delete', record });
    setError('');
  }

  function closeFuelAction() {
    setFuelAction(null);
    setFuelSubmitting(false);
  }

  async function submitFuelEdit() {
    setFuelSubmitting(true);
    setError('');
    try {
      await api.updateFuelRecord(fuelAction.record.id, {
        amount: Number(fuelForm.amount),
        date: fuelForm.date,
      });
      setMessage('Carga actualizada correctamente.');
      closeFuelAction();
      await loadRecords();
      onFuelChanged?.();
    } catch (saveError) {
      setError(saveError.message);
      setFuelSubmitting(false);
    }
  }

  async function confirmFuelDelete() {
    setFuelSubmitting(true);
    setError('');
    try {
      await api.deleteFuelRecord(fuelAction.record.id);
      setMessage('Carga eliminada correctamente.');
      closeFuelAction();
      await loadRecords();
      onFuelChanged?.();
    } catch (deleteError) {
      setError(deleteError.message);
      setFuelSubmitting(false);
    }
  }

  function validateFleetEntries() {
    if (fleetEntries.length === 0) return 'Agregá al menos un vehículo a la carga por flota.';
    const ids = fleetEntries.map((entry) => entry.vehicleId);
    if (ids.some((id) => id === '')) return 'Seleccioná el vehículo en todas las filas.';
    if (new Set(ids).size !== ids.length) return 'Un vehículo no puede repetirse en la misma carga.';

    for (let index = 0; index < fleetEntries.length; index += 1) {
      const entry = fleetEntries[index];
      const current = Number(entry.pumpCurrent);
      if (entry.pumpCurrent === '' || !Number.isFinite(current) || current <= 0) {
        return `Vehículo ${index + 1}: la lectura actual de la bomba debe ser mayor que cero.`;
      }
      if (index === 0 && entry.pumpPrevious === '') continue;
      const previous = Number(entry.pumpPrevious);
      if (entry.pumpPrevious === '' || !Number.isFinite(previous) || previous < 0) {
        return `Vehículo ${index + 1}: la lectura anterior de la bomba es obligatoria.`;
      }
      if (current <= previous) {
        return `Vehículo ${index + 1}: la lectura actual debe ser mayor que la anterior.`;
      }
      if (previous !== Number(fleetEntries[index - 1].pumpCurrent)) {
        return `Vehículo ${index + 1}: la lectura anterior debe coincidir con la lectura actual del vehículo ${index}.`;
      }
    }
    return '';
  }

  async function submitIndividual() {
    setError('');
    setMessage('');
    if (!form.vehicleId || !form.amount) {
      setError('Seleccioná el vehículo y la lectura actual de la bomba.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createFuelRecord({
        vehicleId: Number(form.vehicleId),
        amount: Number(form.amount),
      });
      setForm(emptyForm);
      setMessage('Carga registrada correctamente.');
      await loadRecords();
      onFuelChanged?.();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFleet() {
    setError('');
    setMessage('');
    const fleetError = validateFleetEntries();
    if (fleetError) {
      setError(fleetError);
      return;
    }
    setSubmitting(true);
    try {
      await api.createFuelRecord({
        origin: 'flota',
        entries: fleetEntries.map((entry) => ({
          vehicleId: Number(entry.vehicleId),
          pumpPrevious: optionalNumber(entry.pumpPrevious),
          pumpCurrent: optionalNumber(entry.pumpCurrent),
        })),
      });
      setFleetEntries([]);
      setMessage('Carga de flota registrada correctamente.');
      await loadRecords();
      onFuelChanged?.();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const vehicleOptions = activeVehicles.map((vehicle) => ({ label: vehicle.name, value: vehicle.id }));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={typography.eyebrow}>Gasolinera</Text>
          <Text style={typography.h2}>
            {mode === 'individual' ? 'Registrar carga individual' : 'Registrar carga por flota'}
          </Text>
        </View>
        <View style={styles.modeTabs}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeTab, mode === 'individual' ? styles.modeTabActive : styles.modeTabIdle]}
            onPress={() => switchMode('individual')}
          >
            <Text style={[styles.modeTabText, mode === 'individual' ? styles.modeTabTextActive : styles.modeTabTextIdle]}>
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeTab, mode === 'fleet' ? styles.modeTabActive : styles.modeTabIdle]}
            onPress={() => switchMode('fleet')}
          >
            <Text style={[styles.modeTabText, mode === 'fleet' ? styles.modeTabTextActive : styles.modeTabTextIdle]}>
              Por flota
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error !== '' && <Text style={[styles.alert, styles.alertError]}>{error}</Text>}
      {message !== '' && <Text style={[styles.alert, styles.alertSuccess]}>{message}</Text>}

      {pendingVehicles.length > 0 && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            {pendingVehicles.length === 1
              ? '1 vehículo aún no tiene actualizado el kilometraje de esta semana.'
              : `${pendingVehicles.length} vehículos aún no tienen actualizado el kilometraje de esta semana.`}
          </Text>
          <View style={styles.pendingList}>
            {pendingVehicles.map((vehicle) => (
              <Button
                key={vehicle.id}
                variant="secondary"
                onPress={() => onRequestMileageUpdate?.(vehicle)}
                style={styles.pendingButton}
              >
                Actualizar {vehicle.name}
              </Button>
            ))}
          </View>
        </View>
      )}

      {mode === 'individual' ? (
        <View style={styles.form}>
          <Select
            label="Vehículo"
            value={form.vehicleId}
            onChange={(value) => setForm((current) => ({ ...current, vehicleId: value }))}
            options={vehicleOptions}
            placeholder="Seleccionar vehículo"
            style={styles.fieldGap}
          />
          <Field
            label="Lectura actual (C$)"
            value={form.amount}
            onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
            keyboardType="numeric"
            hint="Lo que muestra la pantalla de la gasolinera."
            required
          />
          <Button variant="primary" onPress={submitIndividual} loading={submitting} style={styles.submitFull}>
            Guardar carga
          </Button>
        </View>
      ) : (
        <View style={styles.form}>
          {fleetEntries.map((entry, index) => (
            <View key={`${index}-${entry.vehicleId}`} style={styles.fleetEntry}>
              <Text style={styles.fleetTitle}>Vehículo {index + 1}</Text>
              <Select
                value={entry.vehicleId}
                onChange={(value) => updateFleetEntry(index, 'vehicleId', value)}
                options={vehicleOptions}
                placeholder="Seleccionar vehículo"
                style={styles.fieldGap}
              />
              <Field
                label={index === 0 ? 'Lectura anterior (opcional)' : 'Lectura anterior'}
                value={entry.pumpPrevious}
                onChangeText={(value) => updateFleetEntry(index, 'pumpPrevious', value)}
                keyboardType="numeric"
                style={styles.fieldGap}
              />
              <Field
                label="Lectura actual"
                value={entry.pumpCurrent}
                onChangeText={(value) => updateFleetEntry(index, 'pumpCurrent', value)}
                keyboardType="numeric"
                required
              />
              <TouchableOpacity style={styles.removeButton} onPress={() => removeFleetEntry(index)}>
                <Text style={styles.removeButtonText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.fleetActions}>
            <Button variant="secondary" onPress={addFleetEntry} style={styles.fleetAction}>Agregar vehículo</Button>
            <Button
              variant="primary"
              onPress={submitFleet}
              loading={submitting}
              disabled={fleetEntries.length === 0}
              style={styles.fleetAction}
            >
              Guardar carga de flota
            </Button>
          </View>
        </View>
      )}

      <View style={styles.records}>
        <Text style={typography.eyebrow}>Últimas cargas</Text>
        {records.slice(0, 10).map((record) => (
          <View key={record.id} style={styles.record}>
            <View style={styles.recordTop}>
              <Text style={styles.recordName} numberOfLines={1}>
                {record.vehicleAlias || `Vehículo #${record.vehicleId}`}
              </Text>
              <View style={styles.originPill}>
                <Text style={styles.originPillText}>{originLabel(record.origin)}</Text>
              </View>
            </View>
            <View style={styles.recordBottom}>
              <Text style={styles.recordAmount}>C$ {numberLabel(record.amount)}</Text>
              <Text style={styles.recordMeta}>{formatDate(record.date)}</Text>
              {record.kilometersPerLiter != null && (
                <Text style={styles.recordMeta}>· {numberLabel(record.kilometersPerLiter)} km/L</Text>
              )}
              <TouchableOpacity style={styles.actionPrimary} onPress={() => openFuelEdit(record)}>
                <Text style={styles.actionPrimaryText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionDanger} onPress={() => openFuelDelete(record)}>
                <Text style={styles.actionDangerText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <AppModal
        visible={fuelAction?.type === 'edit'}
        onClose={closeFuelAction}
        eyebrow="Gasolinera"
        title="Editar carga"
      >
        <Text style={styles.modalText}>{fuelAction?.record?.vehicleAlias} · {formatDate(fuelAction?.record?.date)}</Text>
        <Field
          label="Monto (C$)"
          value={fuelForm.amount}
          onChangeText={(value) => setFuelForm((current) => ({ ...current, amount: value }))}
          keyboardType="numeric"
          required
        />
        <Field
          label="Fecha (AAAA-MM-DD)"
          value={fuelForm.date}
          onChangeText={(value) => setFuelForm((current) => ({ ...current, date: value }))}
          placeholder="2024-01-15"
          required
        />
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={closeFuelAction} style={styles.modalAction}>Cancelar</Button>
          <Button variant="primary" onPress={submitFuelEdit} loading={fuelSubmitting} style={styles.modalAction}>
            Guardar cambios
          </Button>
        </View>
      </AppModal>

      <AppModal
        visible={fuelAction?.type === 'delete'}
        onClose={closeFuelAction}
        eyebrow="Gasolinera"
        title="Borrar carga"
      >
        <Text style={styles.modalText}>
          ¿Borrar la carga de <Text style={styles.bold}>{fuelAction?.record?.vehicleAlias}</Text> por C$ {numberLabel(fuelAction?.record?.amount)}?
          Se recalcularán los km y el rendimiento de las cargas posteriores.
        </Text>
        <View style={styles.modalActions}>
          <Button variant="secondary" onPress={closeFuelAction} style={styles.modalAction}>Cancelar</Button>
          <Button variant="danger" onPress={confirmFuelDelete} loading={fuelSubmitting} style={styles.modalAction}>
            Borrar carga
          </Button>
        </View>
      </AppModal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerText: {
    flexShrink: 1,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  modeTab: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modeTabIdle: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeTabActive: {
    borderColor: colors.arctic,
    backgroundColor: colors.arctic,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modeTabTextIdle: {
    color: colors.muted,
  },
  modeTabTextActive: {
    color: colors.onArctic,
  },
  alert: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  alertError: {
    backgroundColor: colors.dangerBgStrong,
    borderColor: colors.dangerBorderStrong,
    color: colors.dangerMint,
  },
  alertSuccess: {
    backgroundColor: colors.mintBg,
    borderColor: colors.mintBorder,
    color: colors.mint,
  },
  warningCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    backgroundColor: colors.warnBg,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.warnText,
  },
  pendingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pendingButton: {
    flexGrow: 1,
    flexBasis: 140,
  },
  form: {
    gap: 4,
  },
  fieldGap: {
    marginTop: 4,
    marginBottom: 14,
  },
  submitFull: {
    marginTop: 6,
  },
  fleetEntry: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 12,
  },
  fleetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
    marginBottom: 10,
  },
  removeButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorderStrong,
    backgroundColor: colors.dangerDeep,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dangerSoft,
  },
  fleetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  fleetAction: {
    flexGrow: 1,
    flexBasis: 150,
  },
  records: {
    marginTop: 24,
  },
  record: {
    marginTop: 9,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: 13,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recordName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  originPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderField,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  originPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  recordBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
  },
  recordMeta: {
    fontSize: 13,
    color: colors.muted,
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
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '700',
    color: colors.frost,
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
