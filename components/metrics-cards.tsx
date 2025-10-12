import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Employee } from "@/hooks/use-employees"

interface MetricsCardsProps {
  employees: Employee[]
}

export function MetricsCards({ employees }: MetricsCardsProps) {
  // Расчет статистики на основе данных сотрудников
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.status === 'active').length
  
  // Расчет общего фонда оплаты труда
  const totalSalary = employees
    .filter(emp => emp.status === 'active')
    .reduce((sum, emp) => {
      const salary = Number.parseInt(emp.salary.replace(/[^\d]/g, ""))
      return sum + salary
    }, 0)

  // Расчет налогов и отчислений
  const totalTaxes = employees
    .filter(emp => emp.status === 'active')
    .reduce((sum, emp) => {
      const ipn = Number.parseInt(emp.taxes.ipn.replace(/[^\d]/g, ""))
      const so = Number.parseInt(emp.taxes.so.replace(/[^\d]/g, ""))
      const opv = Number.parseInt(emp.taxes.opv.replace(/[^\d]/g, ""))
      const osms = Number.parseInt(emp.taxes.osms.replace(/[^\d]/g, ""))
      return sum + ipn + so + opv + osms
    }, 0)

  // Расчет суммы к выплате
  const totalToPay = employees
    .filter(emp => emp.status === 'active')
    .reduce((sum, emp) => {
      const salary = Number.parseInt(emp.salary.replace(/[^\d]/g, ""))
      const ipn = Number.parseInt(emp.taxes.ipn.replace(/[^\d]/g, ""))
      const opv = Number.parseInt(emp.taxes.opv.replace(/[^\d]/g, ""))
      const osms = Number.parseInt(emp.taxes.osms.replace(/[^\d]/g, ""))
      return sum + (salary - ipn - opv - osms)
    }, 0)

  // Примерные данные для демонстрации (можно заменить на реальные данные из других источников)
  const totalRevenue = 2450000 // Общие доходы
  const totalExpenses = 1230000 + totalSalary + totalTaxes // Общие расходы включая зарплаты
  const netProfit = totalRevenue - totalExpenses // Чистая прибыль

  const metrics = [
    {
      title: "Общие доходы",
      value: `₸ ${totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Общие расходы",
      value: `₸ ${totalExpenses.toLocaleString()}`,
      change: "+8.2%",
      trend: "up" as const,
      icon: Receipt,
      color: "text-destructive",
    },
    {
      title: "Чистая прибыль",
      value: `₸ ${netProfit.toLocaleString()}`,
      change: netProfit > 0 ? "+18.3%" : "-5.2%",
      trend: netProfit > 0 ? "up" as const : "down" as const,
      icon: Wallet,
      color: netProfit > 0 ? "text-accent" : "text-destructive",
    },
    {
      title: "Фонд оплаты труда",
      value: `₸ ${totalSalary.toLocaleString()}`,
      change: `${activeEmployees} сотрудников`,
      trend: "neutral" as const,
      icon: Users,
      color: "text-primary",
    },
  ]

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
                {metric.trend !== "neutral" && <span className="text-xs text-muted-foreground ml-1">за месяц</span>}
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
