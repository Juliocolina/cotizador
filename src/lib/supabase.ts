import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Exportamos el cliente para uso en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey)