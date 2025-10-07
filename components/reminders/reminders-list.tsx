"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Calendar, FileText, Users, DollarSign, Clock } from "lucide-react"

const reminders = [
  {
    id: 1,
    title: "Отправить ЭСФ по договору № 78",
    description: 'Электронный счет-фактура для ТОО "Альфа Строй"',
    dueDate: "15 окт 2025",
    dueTime: "17:00",
    priority: "high",
    category: "documents",
    completed: false,
  },
  {
    id: 2,
    title: "Оплатить ИПН за сентябрь",
    description: "Индивидуальный подоходный налог - ₸ 40,000",
    dueDate: "15 окт 2025",
    dueTime: "23:59",
    priority: "high",
    category: "taxes",
    completed: false,
  },
  {
    id: 3,
    title: "Начислить зарплату сотрудникам",
    description: "Расчет и начисление за октябрь 2025",
    dueDate: "20 окт 2025",
    dueTime: "12:00",
    priority: "medium",
    category: "payroll",
    completed: false,
  },
  {
    id: 4,
    title: "Подготовить отчет по НДС",
    description: "Налоговая декларация за 3 квартал",
    dueDate: "25 окт 2025",
    dueTime: "18:00",
    priority: "medium",
    category: "taxes",
    completed: false,
  },
  {
    id: 5,
    title: "Проверить акты сверки с контрагентами",
    description: "Сверка взаиморасчетов за квартал",
    dueDate: "30 окт 2025",
    dueTime: "15:00",
    priority: "low",
    category: "documents",
    completed: false,
  },
  {
    id: 6,
    title: "Обновить данные сотрудников",
    description: "Актуализация личных данных в системе",
    dueDate: "01 ноя 2025",
    dueTime: "10:00",
    priority: "low",
    category: "payroll",
    completed: false,
  },
  {
    id: 7,
    title: "Оплатить КПН за 3 квартал",
    description: "Корпоративный подоходный налог - ₸ 164,000",
    dueDate: "20 окт 2025",
    dueTime: "23:59",
    priority: "high",
    category: "taxes",
    completed: false,
  },
  {
    id: 8,
    title: "Подготовить финансовый отчет",
    description: "Квартальный отчет для руководства",
    dueDate: "28 окт 2025",
    dueTime: "16:00",
    priority: "medium",
    category: "reports",
    completed: true,
  },
]

const categoryConfig = {
  documents: { label: "Документы", icon: FileText, color: "text-primary" },
  taxes: { label: "Налоги", icon: DollarSign, color: "text-warning" },
  payroll: { label: "Зарплата", icon: Users, color: "text-success" },
  reports: { label: "Отчеты", icon: Calendar, color: "text-accent" },
}

const priorityConfig = {
  high: { label: "Высокий", color: "bg-destructive text-destructive-foreground" },
  medium: { label: "Средний", color: "bg-warning text-warning-foreground" },
  low: { label: "Низкий", color: "bg-muted text-muted-foreground" },
}

export function RemindersList() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Все напоминания</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Активные ({reminders.filter((r) => !r.completed).length})
          </Button>
          <Button variant="ghost" size="sm">
            Завершенные ({reminders.filter((r) => r.completed).length})
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder) => {
          const category = categoryConfig[reminder.category as keyof typeof categoryConfig]
          const priority = priorityConfig[reminder.priority as keyof typeof priorityConfig]
          const CategoryIcon = category.icon

          return (
            <div
              key={reminder.id}
              className={`flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 ${
                reminder.completed ? "opacity-60" : ""
              }`}
            >
              <Checkbox checked={reminder.completed} className="mt-1" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${reminder.completed ? "line-through" : ""}`}>{reminder.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                  </div>
                  <Badge className={priority.color}>{priority.label}</Badge>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CategoryIcon className={`w-3 h-3 ${category.color}`} />
                    {category.label}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {reminder.dueDate}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {reminder.dueTime}
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
