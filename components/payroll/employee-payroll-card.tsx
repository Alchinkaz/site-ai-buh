"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, Eye, EyeOff } from "lucide-react"
import { 
  calculatePayroll, 
  EmployeePayrollData, 
  PayrollCalculation,
  EmployeeCategory,
  AdditionalDeduction,
  formatCurrency,
  getEmployeeCategoryLabel
} from "@/lib/payroll-calculator"
import { PayrollCalculationCard } from "./payroll-calculation-card"
import { PayrollExport } from "./payroll-export"

interface EmployeePayrollCardProps {
  employee: {
    id: number
    name: string
    position: string
    salary: string
    email: string
    phone: string
    address?: string
    socialMedia?: string
    status: "active" | "pending" | "inactive" | "dismissed"
    workSchedule?: string
    hireDate?: string
    dismissDate?: string
    taxes: {
      ipn: string
      so: string
      opv: string
      osms: string
    }
  }
}

export function EmployeePayrollCard({ employee }: EmployeePayrollCardProps) {
  const [showCalculation, setShowCalculation] = useState(false)
  const [calculation, setCalculation] = useState<PayrollCalculation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Преобразуем данные сотрудника в формат для расчета
  const getEmployeePayrollData = (): EmployeePayrollData => {
    const salaryNumber = Number(employee.salary.replace(/[^\d]/g, ""))
    
    return {
      id: employee.id,
      name: employee.name,
      salary: salaryNumber,
      category: "standard" as EmployeeCategory, // По умолчанию обычный сотрудник
      additionalDeductions: [] as AdditionalDeduction[],
      harmfulWork: false,
    }
  }

  const handleCalculate = async () => {
    setIsCalculating(true)
    
    try {
      const employeeData = getEmployeePayrollData()
      const result = calculatePayroll(employeeData)
      setCalculation(result)
      setShowCalculation(true)
    } catch (error) {
      console.error('Ошибка расчета зарплаты:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const employeeData = getEmployeePayrollData()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{employee.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{employee.position}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status === "active" ? "Активный" : 
               employee.status === "pending" ? "Ожидает" :
               employee.status === "inactive" ? "Неактивный" : "Уволен"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? "Расчет..." : "Рассчитать"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Зарплата</p>
            <p className="text-lg font-semibold text-green-600">{employee.salary}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">График работы</p>
            <p className="text-sm">{employee.workSchedule || "Не указан"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{employee.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Телефон</p>
            <p className="text-sm">{employee.phone}</p>
          </div>
        </div>

        {employee.address && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Адрес</p>
            <p className="text-sm">{employee.address}</p>
          </div>
        )}

        {employee.socialMedia && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Социальные сети</p>
            <p className="text-sm">{employee.socialMedia}</p>
          </div>
        )}

        {/* Старые расчеты налогов (для сравнения) */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Текущие расчеты налогов</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex justify-between">
              <span>ИПН:</span>
              <span className="font-medium">{employee.taxes.ipn}</span>
            </div>
            <div className="flex justify-between">
              <span>СО:</span>
              <span className="font-medium">{employee.taxes.so}</span>
            </div>
            <div className="flex justify-between">
              <span>ОПВ:</span>
              <span className="font-medium">{employee.taxes.opv}</span>
            </div>
            <div className="flex justify-between">
              <span>ОСМС:</span>
              <span className="font-medium">{employee.taxes.osms}</span>
            </div>
          </div>
        </div>

        {/* Новый расчет зарплаты */}
        {calculation && showCalculation && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Расчет по новому алгоритму (2025)</h3>
              <div className="flex gap-2">
                <PayrollExport 
                  employee={employeeData} 
                  calculation={calculation}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculation(false)}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Скрыть
                </Button>
              </div>
            </div>
            
            <PayrollCalculationCard 
              employee={employeeData} 
              calculation={calculation} 
            />
          </div>
        )}

        {calculation && !showCalculation && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Расчет готов</p>
                <p className="text-sm">
                  К выплате: <span className="font-semibold text-green-600">
                    {formatCurrency(calculation.netSalary)}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <PayrollExport 
                  employee={employeeData} 
                  calculation={calculation}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculation(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Показать детали
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
