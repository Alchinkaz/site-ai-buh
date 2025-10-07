import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock } from "lucide-react"

const urgentTasks = [
  {
    title: "Оплатить ИПН",
    time: "Сегодня, 23:59",
    status: "urgent",
  },
  {
    title: "Отправить ЭСФ",
    time: "Сегодня, 17:00",
    status: "urgent",
  },
  {
    title: "Начислить зарплату",
    time: "Через 5 дней",
    status: "upcoming",
  },
  {
    title: "Отчет по НДС",
    time: "Через 10 дней",
    status: "upcoming",
  },
]

export function UpcomingTasks() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold">Срочные задачи</h3>
      </div>

      <div className="space-y-3">
        {urgentTasks.map((task, idx) => (
          <div key={idx} className="p-3 rounded-lg border border-border hover:bg-accent/50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-medium text-sm text-pretty">{task.title}</p>
              <Badge variant={task.status === "urgent" ? "destructive" : "secondary"} className="flex-shrink-0">
                {task.status === "urgent" ? "Срочно" : "Скоро"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.time}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <p className="text-sm font-medium text-primary mb-1">Совет дня</p>
        <p className="text-xs text-muted-foreground text-pretty">
          Не забудьте проверить акты сверки с контрагентами перед концом месяца. Это поможет избежать расхождений в
          отчетности.
        </p>
      </div>
    </Card>
  )
}
