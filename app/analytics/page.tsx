import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsHeader } from "@/components/analytics/analytics-header"
import { AnalyticsCharts } from "@/components/analytics/analytics-charts"
import { AnalyticsMetrics } from "@/components/analytics/analytics-metrics"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <AnalyticsHeader />
        <AnalyticsMetrics />
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  )
}
