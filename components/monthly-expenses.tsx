"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown, TrendingUp } from "lucide-react"

const expenses = [
  { category: "Аренда офиса", amount: 250000, change: 0, color: "bg-blue-500" },
  { category: "Зарплата", amount: 1500000, change: 5, color: "bg-green-500" },
  { category: "Налоги", amount: 450000, change: -2, color: "bg-purple-500" },
  { category: "Коммунальные услуги", amount: 75000, change: 3, color: "bg-orange-500" },
  { category: "Интернет и связь", amount: 35000, change: 0, color: "bg-cyan-500" },
  { category: "Канцелярия", amount: 15000, change: -10, color: "bg-pink-500" },
]

export function MonthlyExpenses() {
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ежемесячные расходы</CardTitle>
        <p className="text-sm text-muted-foreground">Общие расходы: {totalExpenses.toLocaleString("ru-KZ")} ₸</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.category} className="flex items-center gap-4">
              <div className={`w-2 h-12 rounded-full ${expense.color}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{expense.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{expense.amount.toLocaleString("ru-KZ")} ₸</span>
                    {expense.change !== 0 && (
                      <span
                        className={`flex items-center text-xs ${expense.change > 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        {expense.change > 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {Math.abs(expense.change)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${expense.color}`}
                    style={{ width: `${(expense.amount / totalExpenses) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
