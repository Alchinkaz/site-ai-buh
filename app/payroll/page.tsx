"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { EmployeeList } from "@/components/payroll/employee-list"
import { PayrollSummary } from "@/components/payroll/payroll-summary"
import { SupabaseTest } from "@/components/supabase-test"
import { SupabaseSetup } from "@/components/supabase-setup"
import { useEmployeesSafe } from "@/hooks/use-employees-safe"

export default function PayrollPage() {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee, 
    dismissEmployee, 
    loading, 
    error,
    isUsingSupabase,
    supabaseError
  } = useEmployeesSafe()

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка сотрудников...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    // Проверяем, является ли ошибка связанной с отсутствием таблицы
    const isTableNotFound = error.includes("Could not find the table") || 
                           error.includes("relation") || 
                           error.includes("does not exist")
    
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="text-destructive text-lg mb-2">Ошибка загрузки</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
          
          {isTableNotFound ? (
            <SupabaseSetup />
          ) : (
            <SupabaseTest />
          )}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUsingSupabase ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isUsingSupabase ? 'Синхронизация с Supabase' : 'Локальный режим'}
            </span>
          </div>
          {supabaseError && (
            <div className="text-xs text-destructive">
              Ошибка Supabase: {supabaseError}
            </div>
          )}
        </div>
        <PayrollHeader onEmployeeAdd={addEmployee} />
        <PayrollSummary />
        <EmployeeList 
          employees={employees} 
          onEmployeeUpdate={updateEmployee}
          onEmployeeDelete={deleteEmployee}
          onEmployeeDismiss={dismissEmployee}
        />
      </div>
    </DashboardLayout>
  )
}
