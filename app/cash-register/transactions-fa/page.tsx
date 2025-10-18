"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Upload } from "lucide-react"
import { FinanceProvider } from "@/lib/financeapp/finance-context"
import { TransactionList } from "@/components/financeapp/transaction-list"
import { TransactionForm } from "@/components/financeapp/transaction-form"
import { StatementImport } from "@/components/financeapp/statement-import"
import { PDFImport } from "@/components/financeapp/pdf-import"

export default function TransactionsFAPage() {
  const [open, setOpen] = useState(false)

  return (
    <DashboardLayout>
      <FinanceProvider>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Транзакции (FinanceApp)</h1>
              <p className="text-muted-foreground mt-2">Доходы, расходы и переводы между счетами</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/cash-register/accounts-fa">
                <Button variant="secondary">Счета (FA)</Button>
              </Link>
              <StatementImport />
              <PDFImport />
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Новая транзакция
              </Button>
            </div>
          </div>

          <TransactionList />

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новая транзакция</DialogTitle>
                <DialogDescription>Добавьте доход, расход или перевод</DialogDescription>
              </DialogHeader>
              <TransactionForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </FinanceProvider>
    </DashboardLayout>
  )
}


