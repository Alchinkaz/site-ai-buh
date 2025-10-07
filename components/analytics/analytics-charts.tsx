"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

const revenueData = [
  { month: "Янв", revenue: 4500000, expenses: 3200000 },
  { month: "Фев", revenue: 5200000, expenses: 3400000 },
  { month: "Мар", revenue: 4800000, expenses: 3300000 },
  { month: "Апр", revenue: 6100000, expenses: 3600000 },
  { month: "Май", revenue: 5800000, expenses: 3500000 },
  { month: "Июн", revenue: 6500000, expenses: 3700000 },
]

const categoryData = [
  { category: "Товары", amount: 3500000 },
  { category: "Услуги", amount: 2800000 },
  { category: "Консультации", amount: 1200000 },
  { category: "Обучение", amount: 800000 },
]

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Доходы и расходы</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip formatter={(value: number) => `${value.toLocaleString("ru-KZ")} ₸`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Доходы" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--destructive))"
                name="Расходы"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Доходы по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <XAxis dataKey="category" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip formatter={(value: number) => `${value.toLocaleString("ru-KZ")} ₸`} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
