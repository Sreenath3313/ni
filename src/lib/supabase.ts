import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
  // Log the values to help debug
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not Set')
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not Set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('Supabase client initialized.')
