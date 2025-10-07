"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function WarehousesHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Склады</h1>
        <p className="text-muted-foreground mt-2">Управление складами и остатками</p>
      </div>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Добавить склад
      </Button>
    </div>
  )
}
