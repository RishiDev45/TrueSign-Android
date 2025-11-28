import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR ACTUAL KEYS FROM SUPABASE
const supabaseUrl = 'https://qzhskpjekoqrvjjwbgwb.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aHNrcGpla29xcnZqandiZ3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTE4OTEsImV4cCI6MjA3OTg4Nzg5MX0.F-U4QMwnV-_HgRln746EPwM2-lgYL0bgi10d4KCXy3A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});