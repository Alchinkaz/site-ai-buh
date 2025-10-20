import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aigrzflspieakaoaptml.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3J6ZmxzcGllYWthb2FwdG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMTM3MzUsImV4cCI6MjA3NTc4OTczNX0.0hxEz--8z9JfJVadJrb4HwS5wf9xoInEdPAjTycwcNQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для всех таблиц
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
      },
      company_accounts: {
        Row: {
          id: number
          account_number: string
          bank_name: string | null
          account_type: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          account_number: string
          bank_name?: string | null
          account_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          account_number?: string
          bank_name?: string | null
          account_type?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      counterparties: {
        Row: {
          id: number
          name: string
          bin_iin: string | null
          account_number: string | null
          is_our_company: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          bin_iin?: string | null
          account_number?: string | null
          is_our_company?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          bin_iin?: string | null
          account_number?: string | null
          is_our_company?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      transactions_1c: {
        Row: {
          id: number
          payer_name: string | null
          receiver_name: string | null
          payer_bin_iin: string | null
          receiver_bin_iin: string | null
          payer_account: string | null
          receiver_account: string | null
          document_number: string | null
          operation_date: string | null
          document_date: string | null
          expense_amount: string | null
          income_amount: string | null
          total_amount: string | null
          payment_purpose: string | null
          document_type: string | null
          payment_code: string | null
          transaction_type: 'income' | 'expense' | 'transfer'
          from_account: string | null
          to_account: string | null
          counterparty_name: string | null
          category: string | null
          payer_id: number | null
          receiver_id: number | null
          from_account_id: number | null
          to_account_id: number | null
          source_file: string | null
          import_batch_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          payer_name?: string | null
          receiver_name?: string | null
          payer_bin_iin?: string | null
          receiver_bin_iin?: string | null
          payer_account?: string | null
          receiver_account?: string | null
          document_number?: string | null
          operation_date?: string | null
          document_date?: string | null
          expense_amount?: string | number | null
          income_amount?: string | number | null
          total_amount?: string | number | null
          payment_purpose?: string | null
          document_type?: string | null
          payment_code?: string | null
          transaction_type: 'income' | 'expense' | 'transfer'
          from_account?: string | null
          to_account?: string | null
          counterparty_name?: string | null
          category?: string | null
          payer_id?: number | null
          receiver_id?: number | null
          from_account_id?: number | null
          to_account_id?: number | null
          source_file?: string | null
          import_batch_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          payer_name?: string | null
          receiver_name?: string | null
          payer_bin_iin?: string | null
          receiver_bin_iin?: string | null
          payer_account?: string | null
          receiver_account?: string | null
          document_number?: string | null
          operation_date?: string | null
          document_date?: string | null
          expense_amount?: string | number | null
          income_amount?: string | number | null
          total_amount?: string | number | null
          payment_purpose?: string | null
          document_type?: string | null
          payment_code?: string | null
          transaction_type?: 'income' | 'expense' | 'transfer'
          from_account?: string | null
          to_account?: string | null
          counterparty_name?: string | null
          category?: string | null
          payer_id?: number | null
          receiver_id?: number | null
          from_account_id?: number | null
          to_account_id?: number | null
          source_file?: string | null
          import_batch_id?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      import_batches: {
        Row: {
          id: string
          file_name: string
          file_path: string | null
          records_count: number
          status: 'processing' | 'completed' | 'failed'
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          file_name: string
          file_path?: string | null
          records_count?: number
          status?: 'processing' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string | null
          records_count?: number
          status?: 'processing' | 'completed' | 'failed'
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
      },
      transaction_categories: {
        Row: {
          id: number
          name: string
          type: 'income' | 'expense' | 'transfer'
          parent_id: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type: 'income' | 'expense' | 'transfer'
          parent_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: 'income' | 'expense' | 'transfer'
          parent_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      category_rules: {
        Row: {
          id: number
          category_id: number
          rule_type: 'counterparty' | 'purpose' | 'amount'
          rule_value: string
          priority: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          category_id: number
          rule_type: 'counterparty' | 'purpose' | 'amount'
          rule_value: string
          priority?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          category_id?: number
          rule_type?: 'counterparty' | 'purpose' | 'amount'
          rule_value?: string
          priority?: number
          is_active?: boolean
          created_at?: string
        }
      },
      categories: {
        Row: {
          id: number
          name: string
          type: 'income' | 'expense'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          type: 'income' | 'expense'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: 'income' | 'expense'
          created_at?: string
          updated_at?: string
        }
      },
      transactions: {
        Row: {
          id: number
          type: 'income' | 'expense'
          amount: string
          currency: string
          category_id: number | null
          description: string | null
          method: string | null
          occurred_at: string
          created_at: string
          updated_at: string
          source: string | null
          source_ref: string | null
        }
        Insert: {
          id?: number
          type: 'income' | 'expense'
          amount: string | number
          currency?: string
          category_id?: number | null
          description?: string | null
          method?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
          source?: string | null
          source_ref?: string | null
        }
        Update: {
          id?: number
          type?: 'income' | 'expense'
          amount?: string | number
          currency?: string
          category_id?: number | null
          description?: string | null
          method?: string | null
          occurred_at?: string
          created_at?: string
          updated_at?: string
          source?: string | null
          source_ref?: string | null
        }
      },
      chat_ingest_queue: {
        Row: {
          id: number
          message_text: string
          parsed_json: any | null
          status: 'pending' | 'processed' | 'failed'
          error: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: number
          message_text: string
          parsed_json?: any | null
          status?: 'pending' | 'processed' | 'failed'
          error?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: number
          message_text?: string
          parsed_json?: any | null
          status?: 'pending' | 'processed' | 'failed'
          error?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
    }
  }
}
