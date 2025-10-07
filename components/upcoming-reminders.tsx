import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const reminders = [
  {
    id: 1,
    title: 'Отправить АВР по договору с ТОО "Альфа"',
    dueDate: "15 окт 2025",
    priority: "high",
    status: "pending",
  },
  {
    id: 2,
    title: "Уплата НДС за 3 квартал",
    dueDate: "20 окт 2025",
    priority: "high",
    status: "pending",
  },
  {
    id: 3,
    title: "Выплата зарплаты сотрудникам",
    dueDate: "25 окт 2025",
    priority: "medium",
    status: "pending",
  },
  {
    id: 4,
    title: 'Отправить ЭСФ клиенту "Бета"',
    dueDate: "18 окт 2025",
    priority: "medium",
    status: "pending",
  },
]

export function UpcomingReminders() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Важные напоминания</h3>
          <p className="text-sm text-muted-foreground mt-1">Предстоящие задачи и платежи</p>
        </div>
        <Button variant="outline" size="sm">
          Все
        </Button>
      </div>

      <div className="space-y-4">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className={cn("p-2 rounded-lg", reminder.priority === "high" ? "bg-destructive/10" : "bg-warning/10")}>
              {reminder.priority === "high" ? (
                <AlertCircle className="w-4 h-4 text-destructive" />
              ) : (
                <Clock className="w-4 h-4 text-warning" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-pretty">{reminder.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{reminder.dueDate}</p>
            </div>
            <Button size="sm" variant="ghost">
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
