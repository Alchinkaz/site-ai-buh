"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  PayrollCalculation, 
  formatCurrency, 
  getEmployeeCategoryLabel,
  getAdditionalDeductionLabel,
  EmployeePayrollData,
  AdditionalDeduction
} from "@/lib/payroll-calculator"
import { Calculator, User, DollarSign, Receipt, FileText } from "lucide-react"

interface PayrollCalculationCardProps {
  employee: EmployeePayrollData
  calculation: PayrollCalculation
}

export function PayrollCalculationCard({ employee, calculation }: PayrollCalculationCardProps) {
  const { 
    grossSalary, 
    employeeDeductions, 
    employerContributions, 
    totalEmployeeDeductions, 
    totalEmployerContributions, 
    netSalary,
    ipnCalculation,
    taxDeductions
  } = calculation

  return (
    <div className="space-y-6">
      {/* Заголовок с информацией о сотруднике */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Информация о сотруднике
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ФИО</p>
              <p className="text-lg font-semibold">{employee.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Категория</p>
              <Badge variant="secondary" className="mt-1">
                {getEmployeeCategoryLabel(employee.category)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Зарплата</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(grossSalary)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Вредные условия труда</p>
              <Badge variant={employee.harmfulWork ? "destructive" : "secondary"} className="mt-1">
                {employee.harmfulWork ? "Да" : "Нет"}
              </Badge>
            </div>
          </div>
          
          {employee.additionalDeductions.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Дополнительные вычеты</p>
              <div className="flex flex-wrap gap-2">
                {employee.additionalDeductions.map((deduction, index) => (
                  <Badge key={index} variant="outline">
                    {getAdditionalDeductionLabel(deduction)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Итоговые суммы */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              К выплате сотруднику
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(netSalary)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              После всех удержаний
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Удержания с сотрудника
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalEmployeeDeductions)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Налоги и взносы
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Отчисления работодателя
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalEmployerContributions)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              За счет работодателя
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Детализация удержаний с сотрудника */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Удержания с сотрудника
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ОПВ (10%)</span>
                <span className="font-medium">{formatCurrency(employeeDeductions.opv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ВОСМС (2%)</span>
                <span className="font-medium">{formatCurrency(employeeDeductions.vosms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ИПН (10%)</span>
                <span className="font-medium">{formatCurrency(employeeDeductions.ipn)}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Итого удержаний:</span>
            <span className="text-red-600">{formatCurrency(totalEmployeeDeductions)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Детализация отчислений работодателя */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Отчисления работодателя
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ООСМС (3%)</span>
                <span className="font-medium">{formatCurrency(employerContributions.oosms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">СО (5%)</span>
                <span className="font-medium">{formatCurrency(employerContributions.so)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">СН (11%)</span>
                <span className="font-medium">{formatCurrency(employerContributions.sn)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ОППВ (5%)</span>
                <span className="font-medium">{formatCurrency(employerContributions.oppv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ОПВР (2,5%)</span>
                <span className="font-medium">{formatCurrency(employerContributions.opvr)}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Итого отчислений:</span>
            <span className="text-blue-600">{formatCurrency(totalEmployerContributions)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Детализация расчета ИПН */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Детализация расчета ИПН
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Облагаемый доход</span>
              <span className="font-medium">{formatCurrency(ipnCalculation.taxableIncome)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Примененные вычеты</span>
              <span className="font-medium text-green-600">-{formatCurrency(ipnCalculation.appliedDeductions)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Доход после вычетов</span>
              <span className="font-medium">{formatCurrency(ipnCalculation.incomeAfterDeductions)}</span>
            </div>
            
            {ipnCalculation.ninetyPercentAdjustment > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Корректировка на 90%</span>
                <span className="font-medium text-orange-600">-{formatCurrency(ipnCalculation.ninetyPercentAdjustment)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Итоговый облагаемый доход</span>
              <span className="font-medium">{formatCurrency(ipnCalculation.finalTaxableIncome)}</span>
            </div>
            
            <div className="flex justify-between font-semibold">
              <span>ИПН (10%)</span>
              <span className="text-red-600">{formatCurrency(ipnCalculation.ipnAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детализация налоговых вычетов */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Налоговые вычеты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Стандартный вычет (14 МРП)</span>
              <span className="font-medium">{formatCurrency(taxDeductions.standardMrp)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Вычет по ОПВ</span>
              <span className="font-medium">{formatCurrency(taxDeductions.opvDeduction)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Вычет по ВОСМС</span>
              <span className="font-medium">{formatCurrency(taxDeductions.vosmsDeduction)}</span>
            </div>
            
            {taxDeductions.additionalDeductions > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Дополнительные вычеты</span>
                <span className="font-medium">{formatCurrency(taxDeductions.additionalDeductions)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-semibold">
              <span>Общая сумма вычетов</span>
              <span className="text-green-600">{formatCurrency(taxDeductions.totalDeductions)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
