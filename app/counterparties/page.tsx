import { DashboardLayout } from "@/components/dashboard-layout"
import { CounterpartiesHeader } from "@/components/counterparties/counterparties-header"
import { CounterpartiesTable } from "@/components/counterparties/counterparties-table"

export default function CounterpartiesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <CounterpartiesHeader />
        <CounterpartiesTable />
      </div>
    </DashboardLayout>
  )
}
