import { DashboardLayout } from "@/components/dashboard-layout"
import { TradeHeader } from "@/components/trade/trade-header"
import { TradeStats } from "@/components/trade/trade-stats"
import { ProductsTable } from "@/components/trade/products-table"

export default function TradePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <TradeHeader />
        <TradeStats />
        <ProductsTable />
      </div>
    </DashboardLayout>
  )
}
