"use client"

import { useState, useEffect } from "react"
import { useEmployeesSupabase } from "./use-employees-supabase"
import { useEmployeesFallback } from "./use-employees-fallback"

export function useEmployeesSmart() {
  const [useSupabase, setUseSupabase] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  const supabaseHook = useEmployeesSupabase()
  const fallbackHook = useEmployeesFallback()

  // Обрабатываем ошибки Supabase
  useEffect(() => {
    if (useSupabase && supabaseHook.error) {
      setSupabaseError(supabaseHook.error)
      setUseSupabase(false)
    }
  }, [useSupabase, supabaseHook.error])

  // Если Supabase работает, используем его
  if (useSupabase && !supabaseHook.error) {
    return {
      ...supabaseHook,
      isUsingSupabase: true,
      switchToFallback: () => setUseSupabase(false),
      supabaseError: null,
    }
  }

  // Используем fallback
  return {
    ...fallbackHook,
    isUsingSupabase: false,
    switchToSupabase: () => setUseSupabase(true),
    supabaseError,
  }
}
