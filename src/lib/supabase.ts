import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wrdsolfcugrqxgcsuywn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZHNvbGZjdWdycXhnY3N1eXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDI4NTEsImV4cCI6MjA4ODQ3ODg1MX0.SLVIMAO2DdGOO9mDeJ7NULwKPVMVziPgz2O6bghvan8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
