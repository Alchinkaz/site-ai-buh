"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { AddEmployeeForm } from "./add-employee-form"
import { NewEmployeeData } from "@/hooks/use-employees"

interface PayrollHeaderProps {
  onEmployeeAdd: (employee: NewEmployeeData) => void
}

export function PayrollHeader({ onEmployeeAdd }: PayrollHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Зарплата и сотрудники</h1>
        <p className="text-muted-foreground mt-2">Управление персоналом и расчет заработной платы</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
        <AddEmployeeForm onEmployeeAdd={onEmployeeAdd} />
      </div>
    </div>
  )
}
