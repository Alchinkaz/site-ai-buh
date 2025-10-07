"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const transactions = [
  {
    id: 1,
    type: "Приход",
    description: "Оплата от клиента ТОО Компания 1",
    amount: 250000,
    method: "Наличные",
    date: "2024-01-15 14:30",
  },
  {
    id: 2,
    type: "Расход",
    description: "Закупка канцелярии",
    amount: 15000,
    method: "Наличные",
    date: "2024-01-15 12:15",
  },
  {
    id: 3,
    type: "Приход",
    description: "Оплата по счету №145",
    amount: 180000,
    method: "Kaspi QR",
    date: "2024-01-15 11:00",
  },
  {
    id: 4,
    type: "Расход",
    description: "Оплата аренды офиса",
    amount: 250000,
    method: "Перевод",
    date: "2024-01-15 09:30",
  },
]

export function TransactionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние операции</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
              <div
                className={`p-2 rounded-full ${transaction.type === "Приход" ? "bg-green-500/10" : "bg-red-500/10"}`}
              >
                {transaction.type === "Приход" ? (
                  <ArrowDownRight className="w-5 h-5 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-muted-foreground mt-1">{transaction.date}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-lg font-semibold ${transaction.type === "Приход" ? "text-green-500" : "text-red-500"}`}
                >
                  {transaction.type === "Приход" ? "+" : "-"}
                  {transaction.amount.toLocaleString("ru-KZ")} ₸
                </div>
                <Badge variant="outline" className="mt-1">
                  {transaction.method}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
