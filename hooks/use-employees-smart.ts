"use client"

import { useState, useEffect } from "react"
import { useEmployeesSupabase } from "./use-employees-supabase"
import { useEmployeesFallback } from "./use-employees-fallback"

export function useEmployeesSmart() {
  const [useSupabase, setUseSupabase] = useState(true)
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  
  const supabaseHook = useEmployeesSupabase()
  const fallbackHook = useEmployeesFallback()

  // Если Supabase работает, используем его
  if (useSupabase && !supabaseHook.error) {
    return {
      ...supabaseHook,
      isUsingSupabase: true,
      switchToFallback: () => setUseSupabase(false),
      supabaseError: null,
    }
  }

  // Если есть ошибка Supabase, переключаемся на fallback
  if (useSupabase && supabaseHook.error) {
    useEffect(() => {
      setSupabaseError(supabaseHook.error)
      setUseSupabase(false)
    }, [supabaseHook.error])
  }

  // Используем fallback
  return {
    ...fallbackHook,
    isUsingSupabase: false,
    switchToSupabase: () => setUseSupabase(true),
    supabaseError,
  }
}
