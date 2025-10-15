"use client"

import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import Link from "next/link"

export function CashRegisterHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Касса</h1>
        <p className="text-muted-foreground mt-2">Управление кассовыми операциями</p>
      </div>
      <div className="flex gap-2">
        <Link href="/transactions">
          <Button variant="secondary">
            Доходы/Расходы
          </Button>
        </Link>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Отчет
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Новая операция
        </Button>
      </div>
    </div>
  )
}
