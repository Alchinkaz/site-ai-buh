import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const metrics = [
  {
    title: "Общие доходы",
    value: "₸ 2,450,000",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    color: "text-success",
  },
  {
    title: "Общие расходы",
    value: "₸ 1,230,000",
    change: "+8.2%",
    trend: "up",
    icon: Receipt,
    color: "text-destructive",
  },
  {
    title: "Чистая прибыль",
    value: "₸ 820,000",
    change: "+18.3%",
    trend: "up",
    icon: Wallet,
    color: "text-accent",
  },
  {
    title: "Зарплаты",
    value: "₸ 400,000",
    change: "0%",
    trend: "neutral",
    icon: Users,
    color: "text-primary",
  },
]

export function MetricsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <p className="text-2xl font-bold mt-2">{metric.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-success" />}
                {metric.trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
                <span
                  className={cn(
                    "text-sm font-medium",
                    metric.trend === "up" && "text-success",
                    metric.trend === "down" && "text-destructive",
                    metric.trend === "neutral" && "text-muted-foreground",
                  )}
                >
                  {metric.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">за месяц</span>
              </div>
            </div>
            <div className={cn("p-3 rounded-lg bg-secondary", metric.color)}>
              <metric.icon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
