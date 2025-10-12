import { Card } from "@/components/ui/card"
import { Users, Wallet, TrendingUp, AlertCircle } from "lucide-react"
import { Employee } from "@/hooks/use-employees"

interface PayrollSummaryProps {
  employees: Employee[]
}

export function PayrollSummary({ employees }: PayrollSummaryProps) {
  // Расчет статистики на основе реальных данных
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.status === 'active').length
  const dismissedEmployees = employees.filter(emp => emp.status === 'dismissed').length
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length

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

  const stats = [
    {
      label: "Всего сотрудников",
      value: totalEmployees.toString(),
      subtext: `${activeEmployees} активных, ${dismissedEmployees} уволенных`,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Фонд оплаты труда",
      value: `₸ ${totalSalary.toLocaleString()}`,
      subtext: "за месяц",
      icon: Wallet,
      color: "text-success",
    },
    {
      label: "Налоги и отчисления",
      value: `₸ ${totalTaxes.toLocaleString()}`,
      subtext: "ИПН, СО, ОПВ, ОСМС",
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      label: "К выплате",
      value: `₸ ${totalToPay.toLocaleString()}`,
      subtext: pendingEmployees > 0 ? `${pendingEmployees} требуют внимания` : "все выплаты в порядке",
      icon: pendingEmployees > 0 ? AlertCircle : Wallet,
      color: pendingEmployees > 0 ? "text-destructive" : "text-success",
    },
  ]

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
