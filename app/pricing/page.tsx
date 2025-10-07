import { DashboardLayout } from "@/components/dashboard-layout"
import { PricingPlans } from "@/components/pricing/pricing-plans"

export default function PricingPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Тарифные планы</h1>
          <p className="text-muted-foreground mt-2">Выберите подходящий тариф для вашего бизнеса</p>
        </div>
        <PricingPlans />
      </div>
    </DashboardLayout>
  )
}
