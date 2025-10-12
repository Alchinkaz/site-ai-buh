"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { EmployeeList } from "@/components/payroll/employee-list"
import { PayrollSummary } from "@/components/payroll/payroll-summary"
import { useEmployeesSupabase } from "@/hooks/use-employees-supabase"

export default function PayrollPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, dismissEmployee, loading, error } = useEmployeesSupabase()

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
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-destructive text-lg mb-2">Ошибка загрузки</div>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
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
