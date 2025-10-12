"use client"

import { Employee, UpdateEmployeeData } from "@/hooks/use-employees"
import { AddEmployeeForm } from "./add-employee-form"
import { EmployeePayrollCard } from "./employee-payroll-card"
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setIsEditModalOpen(true)
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

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setEditingEmployee(null)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Список сотрудников</h3>

      <div className="space-y-4">
        {employees.map((employee) => (
          <EmployeePayrollCard 
            key={employee.id} 
            employee={employee} 
          />
        ))}
      </div>

      {/* Форма редактирования */}
      <AddEmployeeForm
        editingEmployee={editingEmployee}
        onEmployeeUpdate={(employee) => {
          onEmployeeUpdate?.(employee)
          handleEditModalClose()
        }}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
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
    </div>
  )
}