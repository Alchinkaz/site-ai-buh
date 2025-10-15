"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useEmployeesSafe } from "@/hooks/use-employees-safe"

type HoursByDay = Record<number, string>

export default function AttendancePage() {
  const { employees } = useEmployeesSafe()

  const today = new Date()
  const [year, setYear] = useState<number>(today.getFullYear())
  const [month, setMonth] = useState<number>(today.getMonth()) // 0-11

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month])
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth])

  // demo local state for hours input; in prod save to backend
  const [hoursMap, setHoursMap] = useState<Record<string, HoursByDay>>({})

  useEffect(() => {
    // initialize employees rows with empty hours if not set
    setHoursMap((prev) => {
      const next = { ...prev }
      employees.forEach((e) => {
        const key = String(e.id)
        if (!next[key]) next[key] = {}
      })
      return next
    })
  }, [employees])

  const isWeekend = (d: number) => {
    const date = new Date(year, month, d)
    const day = date.getDay() // 0 Sun - 6 Sat
    return day === 0 || day === 6
  }

  const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  )

  const changeMonth = (delta: number) => {
    const base = new Date(year, month, 1)
    base.setMonth(base.getMonth() + delta)
    setYear(base.getFullYear())
    setMonth(base.getMonth())
  }

  const totalFor = (empId: string) => {
    const row = hoursMap[empId] || {}
    return days.reduce((acc, d) => acc + (Number(row[d] || 0) || 0), 0)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/payroll">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Назад к зарплате
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Посещаемость</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-40 text-center font-medium capitalize">
              {monthLabel}
            </div>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="sticky top-0 bg-background z-10">
                  <th className="border-b p-2 text-left w-56">Имя</th>
                  <th className="border-b p-2 text-left w-32">ЗП начало</th>
                  {days.map((d) => (
                    <th key={d} className={`border-b p-2 text-center ${isWeekend(d) ? 'bg-yellow-200/50' : ''}`}>
                      <div className="leading-none">{String(d).padStart(2, '0')}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(year, month, d))}
                      </div>
                    </th>
                  ))}
                  <th className="border-b p-2 text-center w-24">Всего часов</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const empKey = String(emp.id)
                  const row = hoursMap[empKey] || {}
                  return (
                    <tr key={empKey} className="even:bg-muted/30">
                      <td className="border-b p-2 whitespace-nowrap">{emp.name}</td>
                      <td className="border-b p-2 text-muted-foreground whitespace-nowrap">{emp.salary}</td>
                      {days.map((d) => (
                        <td key={d} className={`border-b p-1 text-center ${isWeekend(d) ? 'bg-yellow-100/60' : ''}`}>
                          <input
                            className="w-12 text-center rounded border bg-background hover:bg-accent focus:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                            value={row[d] || ''}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9nhНН]/gi, '') // digits or N/H for absence/holiday
                              setHoursMap((prev) => ({
                                ...prev,
                                [empKey]: { ...prev[empKey], [d]: v },
                              }))
                            }}
                            placeholder={isWeekend(d) ? '' : '8'}
                          />
                        </td>
                      ))}
                      <td className="border-b p-2 text-center font-medium">{totalFor(empKey)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


