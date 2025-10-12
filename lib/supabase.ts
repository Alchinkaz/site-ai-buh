import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aigrzflspieakaoaptml.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3J6ZmxzcGllYWthb2FwdG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTM3MzUsImV4cCI6MjA3NTc4OTczNX0.0hxEz--8z9JfJVadJrb4HwS5wf9xoInEdPAjTycwcNQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для таблицы employees
export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: number
          name: string
          position: string
          salary: number
          email: string
          phone: string
          address: string | null
          social_media: string | null
          status: 'active' | 'pending' | 'inactive' | 'dismissed'
          work_schedule: string | null
          hire_date: string | null
          dismiss_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          position: string
          salary: number
          email: string
          phone: string
          address?: string | null
          social_media?: string | null
          status?: 'active' | 'pending' | 'inactive' | 'dismissed'
          work_schedule?: string | null
          hire_date?: string | null
          dismiss_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          position?: string
          salary?: number
          email?: string
          phone?: string
          address?: string | null
          social_media?: string | null
          status?: 'active' | 'pending' | 'inactive' | 'dismissed'
          work_schedule?: string | null
          hire_date?: string | null
          dismiss_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
