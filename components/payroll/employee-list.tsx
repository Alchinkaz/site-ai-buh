"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MoreVertical, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Employee } from "@/hooks/use-employees"

interface EmployeeListProps {
  employees: Employee[]
}

export function EmployeeList({ employees }: EmployeeListProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Список сотрудников</h3>

      <div className="space-y-4">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50"
          >
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-semibold">{employee.name}</h4>
                  <p className="text-sm text-muted-foreground">{employee.position}</p>
                  {employee.workSchedule && (
                    <p className="text-xs text-muted-foreground mt-1">
                      График: {getWorkScheduleLabel(employee.workSchedule)}
                    </p>
                  )}
                  {employee.hireDate && (
                    <p className="text-xs text-muted-foreground">
                      Принят: {new Date(employee.hireDate).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                    {employee.status === "active" ? "Активен" : "Ожидает"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Редактировать</DropdownMenuItem>
                      <DropdownMenuItem>Начислить зарплату</DropdownMenuItem>
                      <DropdownMenuItem>История выплат</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Удалить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Оклад</p>
                  <p className="text-lg font-bold">{employee.salary}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ИПН (10%)</p>
                  <p className="text-sm font-medium">{employee.taxes.ipn}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">СО (3.5%)</p>
                  <p className="text-sm font-medium">{employee.taxes.so}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ОПВ (10%)</p>
                  <p className="text-sm font-medium">{employee.taxes.opv}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ОСМС (2%)</p>
                  <p className="text-sm font-medium">{employee.taxes.osms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">К выплате</p>
                  <p className="text-sm font-bold text-success">
                    ₸{" "}
                    {(
                      Number.parseInt(employee.salary.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.ipn.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.opv.replace(/[^\d]/g, "")) -
                      Number.parseInt(employee.taxes.osms.replace(/[^\d]/g, ""))
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {employee.email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {employee.phone}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function getWorkScheduleLabel(schedule: string): string {
  const scheduleLabels: Record<string, string> = {
    "full-time": "Полный рабочий день (8 часов)",
    "part-time": "Неполный рабочий день (4 часа)",
    "flexible": "Гибкий график",
    "shift": "Сменный график",
    "remote": "Удаленная работа",
  }
  return scheduleLabels[schedule] || schedule
}