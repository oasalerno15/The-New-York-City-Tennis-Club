import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Types for our wait times
export interface WaitTime {
  id: string
  court_name: string
  wait_time: string
  comment?: string
  device_id?: string | null
  created_at: string
  expires_at: string
}

export interface NewWaitTime {
  court_name: string
  wait_time: string
  comment?: string
  expires_at: string
  device_id?: string
}

/** Morning sign-up sheet line reports (mobile “Sheets” tab). */
export interface SignupSheetReport {
  id: string
  court_name: string
  borough: string
  status: 'sheet_empty' | 'few_names' | 'line_forming' | 'sheet_full'
  photo_url: string | null
  device_id?: string | null
  created_at: string
  expires_at: string
}

/** Postgrest / Storage errors are plain objects, not always `Error`. */
export function formatSupabaseError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string
      details?: string
      hint?: string
      code?: string
      statusCode?: string
    }
    const parts = [e.message, e.details, e.hint].filter(
      (x): x is string => typeof x === 'string' && x.length > 0
    )
    if (parts.length) {
      const head = parts.join(' — ')
      const code = typeof e.code === 'string' && e.code.length > 0 ? ` [${e.code}]` : ''
      return head + code
    }
  }
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Unknown error'
}
