"use client"

import { Card } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { month: "Янв", income: 1800000, expenses: 1200000 },
  { month: "Фев", income: 2100000, expenses: 1300000 },
  { month: "Мар", income: 2300000, expenses: 1400000 },
  { month: "Апр", income: 2200000, expenses: 1350000 },
  { month: "Май", income: 2400000, expenses: 1450000 },
  { month: "Июн", income: 2450000, expenses: 1230000 },
]

const chartConfig = {
  income: {
    label: "Доходы",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Расходы",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function FinancialChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Финансовая динамика</h3>
        <p className="text-sm text-muted-foreground mt-1">Доходы и расходы за последние 6 месяцев</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `₸${(value / 1000000).toFixed(1)}M`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--color-chart-1)"
            fill="var(--color-chart-1)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stroke="var(--color-chart-5)"
            fill="var(--color-chart-5)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}
