import { DashboardLayout } from "@/components/dashboard-layout"
import { WarehousesHeader } from "@/components/warehouses/warehouses-header"
import { WarehousesList } from "@/components/warehouses/warehouses-list"

export default function WarehousesPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <WarehousesHeader />
        <WarehousesList />
      </div>
    </DashboardLayout>
  )
}
