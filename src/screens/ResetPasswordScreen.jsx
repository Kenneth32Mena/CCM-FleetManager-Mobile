import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, typography } from '../theme';
import Button from '../components/Button';
import Field from '../components/Field';

export default function ResetPasswordScreen({ onDone, onCancel }) {
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
      setMessage('Contraseña actualizada correctamente.');
      onDone();
    } catch (updateException) {
      setError(`No se pudo restablecer la contraseña: ${updateException.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={typography.eyebrow}>CCM FleetManager</Text>
            <Text style={typography.h1}>Restablecer contraseña</Text>
            <Text style={typography.muted}>Ingresa tu nueva contraseña para recuperar el acceso.</Text>

            {error !== '' && <Text style={[styles.alert, styles.alertError]}>{error}</Text>}
            {message !== '' && <Text style={[styles.alert, styles.alertSuccess]}>{message}</Text>}

            <Field label="Nueva contraseña" value={password} onChangeText={setPassword} secureTextEntry required />
            <Field label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry required />

            <Button variant="primary" onPress={submit} loading={submitting} style={styles.submit}>
              Guardar contraseña
            </Button>

            <TouchableOpacity style={styles.link} onPress={onCancel}>
              <Text style={styles.linkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.authCardBg,
    padding: 26,
  },
  alert: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
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
  submit: {
    marginTop: 4,
    marginBottom: 10,
  },
  link: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.arctic,
  },
});
