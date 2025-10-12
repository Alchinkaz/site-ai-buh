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
import { Employee, UpdateEmployeeData } from "@/hooks/use-employees"
import { AddEmployeeForm } from "./add-employee-form"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EmployeeListProps {
  employees: Employee[]
  onEmployeeUpdate?: (employee: UpdateEmployeeData) => void
  onEmployeeDelete?: (id: number) => void
  onEmployeeDismiss?: (id: number) => void
}

export function EmployeeList({ 
  employees, 
  onEmployeeUpdate, 
  onEmployeeDelete, 
  onEmployeeDismiss 
}: EmployeeListProps) {
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [dismissingEmployee, setDismissingEmployee] = useState<Employee | null>(null)

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
  }

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee)
  }

  const handleDismiss = (employee: Employee) => {
    setDismissingEmployee(employee)
  }

  const confirmDelete = () => {
    if (deletingEmployee) {
      onEmployeeDelete?.(deletingEmployee.id)
      setDeletingEmployee(null)
    }
  }

  const confirmDismiss = () => {
    if (dismissingEmployee) {
      onEmployeeDismiss?.(dismissingEmployee.id)
      setDismissingEmployee(null)
    }
  }

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
                  {employee.dismissDate && (
                    <p className="text-xs text-muted-foreground text-red-600">
                      Уволен: {new Date(employee.dismissDate).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                  {employee.address && (
                    <p className="text-xs text-muted-foreground">
                      Адрес: {employee.address}
                    </p>
                  )}
                  {employee.socialMedia && (
                    <p className="text-xs text-muted-foreground">
                      Соцсети: {employee.socialMedia}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    employee.status === "active" ? "default" : 
                    employee.status === "dismissed" ? "destructive" : 
                    "secondary"
                  }>
                    {employee.status === "active" ? "Активен" : 
                     employee.status === "dismissed" ? "Уволен" : 
                     "Ожидает"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(employee)}>
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem>Начислить зарплату</DropdownMenuItem>
                      <DropdownMenuItem>История выплат</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {employee.status !== "dismissed" && (
                        <DropdownMenuItem 
                          onClick={() => handleDismiss(employee)}
                          className="text-orange-600"
                        >
                          Уволить
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(employee)}
                        className="text-destructive"
                      >
                        Удалить
                      </DropdownMenuItem>
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

      {/* Форма редактирования */}
      <AddEmployeeForm
        editingEmployee={editingEmployee}
        onEmployeeUpdate={onEmployeeUpdate}
        trigger={<div style={{ display: 'none' }} />}
      />

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={() => setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить сотрудника "{deletingEmployee?.name}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения увольнения */}
      <AlertDialog open={!!dismissingEmployee} onOpenChange={() => setDismissingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Уволить сотрудника?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите уволить сотрудника "{dismissingEmployee?.name}"? 
              Статус сотрудника изменится на "Уволен".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDismiss} className="bg-orange-600 text-white">
              Уволить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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