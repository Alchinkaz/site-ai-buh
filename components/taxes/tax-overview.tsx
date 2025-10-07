import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

const taxes = [
  {
    name: "КПН (Корпоративный подоходный налог)",
    amount: "₸ 164,000",
    dueDate: "20 окт 2025",
    status: "pending",
    period: "3 квартал 2025",
  },
  {
    name: "НДС (Налог на добавленную стоимость)",
    amount: "₸ 98,400",
    dueDate: "25 окт 2025",
    status: "pending",
    period: "Сентябрь 2025",
  },
  {
    name: "ИПН (Индивидуальный подоходный налог)",
    amount: "₸ 40,000",
    dueDate: "15 окт 2025",
    status: "overdue",
    period: "Сентябрь 2025",
  },
  {
    name: "СО (Социальные отчисления)",
    amount: "₸ 35,000",
    dueDate: "25 окт 2025",
    status: "pending",
    period: "Сентябрь 2025",
  },
  {
    name: "ОПВ (Обязательные пенсионные взносы)",
    amount: "₸ 40,000",
    dueDate: "25 окт 2025",
    status: "pending",
    period: "Сентябрь 2025",
  },
  {
    name: "ОСМС (Обязательное социальное медицинское страхование)",
    amount: "₸ 8,000",
    dueDate: "10 окт 2025",
    status: "paid",
    period: "Сентябрь 2025",
  },
]

const statusConfig = {
  paid: { label: "Оплачен", color: "bg-success text-success-foreground", icon: CheckCircle },
  pending: { label: "Ожидает", color: "bg-warning text-warning-foreground", icon: Clock },
  overdue: { label: "Просрочен", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
}

export function TaxOverview() {
  const totalPending = taxes
    .filter((t) => t.status === "pending" || t.status === "overdue")
    .reduce((sum, t) => sum + Number.parseInt(t.amount.replace(/[^\d]/g, "")), 0)

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Всего к уплате</p>
            <p className="text-3xl font-bold mt-2">₸ {totalPending.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {taxes.filter((t) => t.status === "pending" || t.status === "overdue").length} налогов
            </p>
          </div>
          <Button size="lg">Оплатить все</Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {taxes.map((tax, idx) => {
          const config = statusConfig[tax.status as keyof typeof statusConfig]
          const Icon = config.icon

          return (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Badge className={config.color}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-2 text-pretty">{tax.name}</h3>
              <p className="text-2xl font-bold mb-1">{tax.amount}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{tax.period}</span>
                <span>До {tax.dueDate}</span>
              </div>
              {tax.status !== "paid" && (
                <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent">
                  Оплатить
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
