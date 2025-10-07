import { DashboardLayout } from "@/components/dashboard-layout"
import { TaxOverview } from "@/components/taxes/tax-overview"
import { TaxCalendar } from "@/components/taxes/tax-calendar"
import { TaxCalculator } from "@/components/taxes/tax-calculator"

export default function TaxesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Налоги</h1>
          <p className="text-muted-foreground mt-2">Расчет и управление налоговыми обязательствами</p>
        </div>

        <TaxOverview />

        <div className="grid gap-6 lg:grid-cols-2">
          <TaxCalendar />
          <TaxCalculator />
        </div>
      </div>
    </DashboardLayout>
  )
}
