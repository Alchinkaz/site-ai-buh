"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react"

const stats = [
  { title: "Остаток в кассе", value: "1,250,000 ₸", icon: Wallet, color: "text-blue-500" },
  { title: "Приход за день", value: "450,000 ₸", icon: TrendingUp, color: "text-green-500" },
  { title: "Расход за день", value: "180,000 ₸", icon: TrendingDown, color: "text-red-500" },
  { title: "Безналичные", value: "320,000 ₸", icon: CreditCard, color: "text-purple-500" },
]

export function CashRegisterStats() {
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
