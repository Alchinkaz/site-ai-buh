import { DashboardLayout } from "@/components/dashboard-layout"
import { PayrollHeader } from "@/components/payroll/payroll-header"
import { EmployeeList } from "@/components/payroll/employee-list"
import { PayrollSummary } from "@/components/payroll/payroll-summary"

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PayrollHeader />
        <PayrollSummary />
        <EmployeeList />
      </div>
    </DashboardLayout>
  )
}
