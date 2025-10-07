"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function CounterpartiesHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Контрагенты</h1>
        <p className="text-muted-foreground mt-2">Управление клиентами и поставщиками</p>
      </div>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Добавить контрагента
      </Button>
    </div>
  )
}
