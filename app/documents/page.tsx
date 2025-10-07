import { DashboardLayout } from "@/components/dashboard-layout"
import { DocumentsHeader } from "@/components/documents/documents-header"
import { DocumentsTable } from "@/components/documents/documents-table"

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <DocumentsHeader />
        <DocumentsTable />
      </div>
    </DashboardLayout>
  )
}
