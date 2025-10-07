"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react"

const stats = [
  { title: "Всего товаров", value: "1,234", icon: Package, color: "text-blue-500" },
  { title: "Продано за месяц", value: "156", icon: ShoppingCart, color: "text-green-500" },
  { title: "Выручка", value: "6,500,000 ₸", icon: DollarSign, color: "text-purple-500" },
  { title: "Рост продаж", value: "+12.5%", icon: TrendingUp, color: "text-teal-500" },
]

export function TradeStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
