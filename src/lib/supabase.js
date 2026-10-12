import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Faltan las variables de entorno de Supabase en src/config.js.');
}

if (SUPABASE_URL.includes('TU-PROYECTO') || SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ...')) {
  console.warn('Supabase: revisá src/config.js, todavía tiene valores de ejemplo.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
