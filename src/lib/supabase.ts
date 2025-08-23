import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our wait times
export interface WaitTime {
  id: string
  court_name: string
  wait_time: string
  comment?: string
  created_at: string
  expires_at: string
}

export interface NewWaitTime {
  court_name: string
  wait_time: string
  comment?: string
}
