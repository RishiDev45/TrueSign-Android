import { createClient } from '@supabase/supabase-js';

// REPLACE THESE WITH YOUR REAL KEYS FROM YESTERDAY
// (Go to Supabase Dashboard -> Settings -> API to copy them if you lost them)
const supabaseUrl = 'https://qzhskpjekoqrvjjwbgwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aHNrcGpla29xcnZqandiZ3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTE4OTEsImV4cCI6MjA3OTg4Nzg5MX0.F-U4QMwnV-_HgRln746EPwM2-lgYL0bgi10d4KCXy3A';

// THE CRITICAL PART: The word "export" must be here
export const supabase = createClient(supabaseUrl, supabaseAnonKey);