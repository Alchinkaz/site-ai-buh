import { DashboardLayout } from "@/components/dashboard-layout"
import { CashRegisterHeader } from "@/components/cash-register/cash-register-header"
import { CashRegisterStats } from "@/components/cash-register/cash-register-stats"
import { TransactionsTable } from "@/components/cash-register/transactions-table"

export default function CashRegisterPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <CashRegisterHeader />
        <CashRegisterStats />
        <TransactionsTable />
      </div>
    </DashboardLayout>
  )
}
