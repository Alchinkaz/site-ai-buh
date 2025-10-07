import { DashboardLayout } from "@/components/dashboard-layout"
import { MetricsCards } from "@/components/metrics-cards"
import { FinancialChart } from "@/components/financial-chart"
import { UpcomingReminders } from "@/components/upcoming-reminders"
import { RecentDocuments } from "@/components/recent-documents"
import { MonthlyExpenses } from "@/components/monthly-expenses"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Главная панель</h1>
          <p className="text-muted-foreground mt-2">Обзор финансовых показателей вашего бизнеса</p>
        </div>

        <MetricsCards />

        <MonthlyExpenses />

        <div className="grid gap-6 lg:grid-cols-2">
          <FinancialChart />
          <UpcomingReminders />
        </div>

        <RecentDocuments />
      </div>
    </DashboardLayout>
  )
}
