import { Card } from "@/components/ui/card"
import { Users, Wallet, TrendingUp, AlertCircle } from "lucide-react"

const stats = [
  {
    label: "Всего сотрудников",
    value: "12",
    icon: Users,
    color: "text-primary",
  },
  {
    label: "Фонд оплаты труда",
    value: "₸ 4,800,000",
    subtext: "за месяц",
    icon: Wallet,
    color: "text-success",
  },
  {
    label: "Налоги и отчисления",
    value: "₸ 1,248,000",
    subtext: "ИПН, СО, ОПВ, ОСМС",
    icon: TrendingUp,
    color: "text-warning",
  },
  {
    label: "Требует внимания",
    value: "2",
    subtext: "просроченные выплаты",
    icon: AlertCircle,
    color: "text-destructive",
  },
]

export function PayrollSummary() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            {stat.subtext && <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>}
          </Card>
        )
      })}
    </div>
  )
}
