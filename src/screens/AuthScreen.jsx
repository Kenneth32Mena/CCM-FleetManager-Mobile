import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { colors, typography } from '../theme';
import Button from '../components/Button';
import Field from '../components/Field';

export default function AuthScreen({ onAuthenticated, notice = '', onNoticeShown }) {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function switchView(nextView) {
    setView(nextView);
    setError('');
    setMessage('');
  }

  async function submit() {
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      if (view === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setMessage('Te enviamos un correo con el enlace para restablecer tu contraseña.');
        return;
      }

      const response = view === 'register'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (response.error) {
        setError(response.error.message);
        return;
      }

      if (view === 'register' && !response.data.session) {
        setMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.');
        return;
      }

      if (!response.data.user) {
        setError('Supabase no devolvió una sesión válida.');
        return;
      }

      onNoticeShown?.();
      onAuthenticated(response.data.user);
    } catch (authError) {
      setError(`No se pudo completar la operación: ${authError.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const heading = view === 'register' ? 'Crear cuenta' : view === 'forgot' ? 'Recuperar contraseña' : 'Iniciar sesión';
  const subtitle = view === 'forgot'
    ? 'Te enviaremos un enlace para restablecer tu contraseña.'
    : 'Accede al control operativo de la flota escolar.';

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={typography.eyebrow}>CCM FleetManager</Text>
            <Text style={typography.h1}>{heading}</Text>
            <Text style={typography.muted}>{subtitle}</Text>

            {notice !== '' && <Text style={[styles.alert, styles.alertWarn]}>{notice}</Text>}
            {error !== '' && <Text style={[styles.alert, styles.alertError]}>{error}</Text>}
            {message !== '' && <Text style={[styles.alert, styles.alertSuccess]}>{message}</Text>}

            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />
            {view !== 'forgot' && (
              <Field
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                required
              />
            )}

            <Button variant="primary" onPress={submit} loading={submitting} style={styles.submit}>
              {view === 'register' ? 'Crear cuenta' : view === 'forgot' ? 'Enviar enlace' : 'Entrar'}
            </Button>

            {view === 'login' && (
              <TouchableOpacity style={styles.link} onPress={() => switchView('forgot')}>
                <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            {view === 'forgot' ? (
              <TouchableOpacity style={styles.link} onPress={() => switchView('login')}>
                <Text style={styles.linkText}>Volver a iniciar sesión</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.link} onPress={() => switchView(view === 'register' ? 'login' : 'register')}>
                <Text style={styles.linkText}>
                  {view === 'register' ? 'Ya tengo una cuenta' : 'Crear una cuenta'}
                </Text>
              </TouchableOpacity>
            )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.4,
    shadowRadius: 35,
    elevation: 12,
  },
  alert: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertWarn: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
    color: colors.warnText,
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
