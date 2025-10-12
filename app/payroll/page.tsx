"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { EmployeeList } from "@/components/payroll/employee-list"
import { PayrollSummary } from "@/components/payroll/payroll-summary"
import { useEmployees } from "@/hooks/use-employees"

export default function PayrollPage() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, dismissEmployee } = useEmployees()

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
