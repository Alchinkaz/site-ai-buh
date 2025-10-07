"use client"

import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"

export function RemindersHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Напоминания</h1>
        <p className="text-muted-foreground mt-2">Управление задачами и уведомлениями</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Фильтры
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Создать напоминание
        </Button>
      </div>
    </div>
  )
}
