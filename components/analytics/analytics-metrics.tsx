"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package } from "lucide-react"

const metrics = [
  {
    title: "Средний чек",
    value: "125,000 ₸",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Новые клиенты",
    value: "24",
    change: "+8.3%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Продажи",
    value: "156",
    change: "-3.2%",
    trend: "down",
    icon: ShoppingCart,
  },
  {
    title: "Товары на складе",
    value: "1,234",
    change: "+5.7%",
    trend: "up",
    icon: Package,
  },
]

export function AnalyticsMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {metric.change}
                </span>
                <span className="text-sm text-muted-foreground">за месяц</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
