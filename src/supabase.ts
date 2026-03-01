import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client setup
 *
 * VITE_ prefix is required for Vite to expose env vars to the browser.
 * These are set in .env.local (local dev) and GitHub Secrets (production).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * TypeScript type for an invitee row in the database
 */
export interface Invitee {
  id?: string
  created_at?: string
  last_name: string
  has_plus_one: boolean
  plus_one_name?: string
}

/**
 * TypeScript type for an RSVP row in the database
 */
export interface Rsvp {
  id?: string
  created_at?: string
  guest_name: string
  attending: boolean
  last_name: string
  plus_one_attending?: boolean
  dietary_restrictions?: string
  message?: string
}
