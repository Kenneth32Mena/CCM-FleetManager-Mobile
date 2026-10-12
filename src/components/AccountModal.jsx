import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import AppModal from './Modal';
import Field from './Field';
import Button from './Button';

export default function AccountModal({ user, role = 'Administrador', onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError('');
    setMessage('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setPassword('');
      setConfirm('');
      setMessage('Contraseña actualizada correctamente.');
    } catch (updateException) {
      setError(`No se pudo cambiar la contraseña: ${updateException.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal visible onClose={onClose} eyebrow="Mi cuenta" title="Cuenta" maxWidth={420}>
      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Usuario</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
        </View>
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Text style={styles.infoLabel}>Rol</Text>
          <Text style={styles.infoValue}>{role}</Text>
        </View>
      </View>

      <Text style={styles.sectionEyebrow}>Cambiar contraseña</Text>
      <Field
        label="Nueva contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        required
      />
      <Field
        label="Confirmar contraseña"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        required
      />

      {error && <Text style={[styles.alert, styles.alertError]}>{error}</Text>}
      {message && <Text style={[styles.alert, styles.alertSuccess]}>{message}</Text>}

      <View style={styles.actions}>
        <Button variant="secondary" onPress={onClose} style={styles.actionButton}>Cerrar</Button>
        <Button
          variant="primary"
          onPress={submit}
          loading={submitting}
          disabled={!password || !confirm}
          style={styles.actionButton}
        >
          Guardar contraseña
        </Button>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  info: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDivider,
    paddingVertical: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  infoValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.frost,
    textAlign: 'right',
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.arctic,
    marginBottom: 14,
  },
  alert: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
