"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const reminders = [
  { date: "2024-01-15", title: "Оплата НДС", priority: "Высокий", type: "Налоги" },
  { date: "2024-01-18", title: "Отправить ЭСФ клиенту", priority: "Средний", type: "Документы" },
  { date: "2024-01-20", title: "Выплата зарплаты", priority: "Высокий", type: "Зарплата" },
  { date: "2024-01-22", title: "Подать отчет по ИПН", priority: "Высокий", type: "Налоги" },
  { date: "2024-01-25", title: "Оплата аренды", priority: "Средний", type: "Расходы" },
]

export function RemindersCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1))

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ]

  const getRemindersForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return reminders.filter((r) => r.date === dateStr)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayReminders = getRemindersForDate(day)
            const hasReminders = dayReminders.length > 0

            return (
              <div
                key={day}
                className={`min-h-24 p-2 border border-border rounded-lg ${hasReminders ? "bg-primary/5" : ""}`}
              >
                <div className="text-sm font-medium mb-1">{day}</div>
                <div className="space-y-1">
                  {dayReminders.map((reminder, idx) => (
                    <div key={idx} className="text-xs p-1 bg-background rounded border border-border">
                      <div className="font-medium truncate">{reminder.title}</div>
                      <Badge
                        variant={reminder.priority === "Высокий" ? "destructive" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {reminder.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
