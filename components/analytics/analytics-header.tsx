"use client"

import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"

export function AnalyticsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Аналитика</h1>
        <p className="text-muted-foreground mt-2">Статистика и анализ бизнес-показателей</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Период
        </Button>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </div>
    </div>
  )
}
