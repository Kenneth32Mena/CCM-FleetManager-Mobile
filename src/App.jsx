import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';
import { useIdleTimeout } from './lib/useIdleTimeout';
import { colors } from './theme';
import AuthScreen from './screens/AuthScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  const [recovery, setRecovery] = useState(false);

  useIdleTimeout(() => {
    supabase.auth.signOut();
    setSessionNotice('Tu sesión se cerró por inactividad.');
  }, { enabled: !!user });

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setAuthLoading(false);
      })
      .catch((sessionError) => {
        console.error('No se pudo recuperar la sesión:', sessionError);
        setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
        <ActivityIndicator size="large" color={colors.arctic} />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  if (recovery) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
        <ResetPasswordScreen
          onDone={() => setRecovery(false)}
          onCancel={() => {
            supabase.auth.signOut();
            setRecovery(false);
          }}
        />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
        <AuthScreen
          onAuthenticated={setUser}
          notice={sessionNotice}
          onNoticeShown={() => setSessionNotice('')}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />
      <HomeScreen user={user} onSignOut={() => supabase.auth.signOut()} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: colors.muted,
  },
});
