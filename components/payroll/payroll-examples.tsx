"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calculator, Users, FileText } from "lucide-react"
import { 
  calculatePayroll, 
  EmployeePayrollData, 
  PayrollCalculation,
  EmployeeCategory,
  AdditionalDeduction,
  formatCurrency,
  getEmployeeCategoryLabel
} from "@/lib/payroll-calculator"
import { PayrollCalculationCard } from "@/components/payroll/payroll-calculation-card"
import { PayrollExport } from "@/components/payroll/payroll-export"

// Примеры сотрудников для демонстрации
const exampleEmployees: EmployeePayrollData[] = [
  {
    id: 1,
    name: "Айгуль Нурланова",
    salary: 500000,
    category: "standard" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 2,
    name: "Ерлан Сапаров",
    salary: 200000,
    category: "standard" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 3,
    name: "Динара Касымова",
    salary: 85000,
    category: "standard" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 4,
    name: "Марат Кенжебаев",
    salary: 300000,
    category: "pensioner_age" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 5,
    name: "Асель Токтарова",
    salary: 300000,
    category: "disabled_1_2" as EmployeeCategory,
    additionalDeductions: ["disability"] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 6,
    name: "Нурлан Абдуллаев",
    salary: 300000,
    category: "foreigner_resident" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 7,
    name: "Айдар Жумабаев",
    salary: 300000,
    category: "foreigner_eaeu_temporary" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 8,
    name: "Светлана Петрова",
    salary: 300000,
    category: "parent_disabled_child" as EmployeeCategory,
    additionalDeductions: ["child_disability"] as AdditionalDeduction[],
    harmfulWork: false,
  },
  {
    id: 9,
    name: "Алексей Смирнов",
    salary: 300000,
    category: "standard" as EmployeeCategory,
    additionalDeductions: [] as AdditionalDeduction[],
    harmfulWork: true, // Вредные условия труда
  },
]

export function PayrollExamples() {
  const [selectedEmployee, setSelectedEmployee] = React.useState<EmployeePayrollData | null>(null)
  const [calculation, setCalculation] = React.useState<PayrollCalculation | null>(null)

  const handleCalculate = (employee: EmployeePayrollData) => {
    const result = calculatePayroll(employee)
    setCalculation(result)
    setSelectedEmployee(employee)
  }

  const calculateAll = () => {
    // Можно добавить функцию для расчета всех сотрудников
    console.log("Расчет всех сотрудников")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Примеры расчета зарплаты для разных категорий сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Выберите сотрудника для просмотра детального расчета заработной платы 
            согласно законодательству Казахстана 2025 года.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exampleEmployees.map((employee) => (
              <Card key={employee.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold">{employee.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {getEmployeeCategoryLabel(employee.category)}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Зарплата</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(employee.salary)}
                      </p>
                    </div>
                    
                    {employee.harmfulWork && (
                      <Badge variant="destructive">Вредные условия труда</Badge>
                    )}
                    
                    {employee.additionalDeductions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Дополнительные вычеты:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {employee.additionalDeductions.map((deduction, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {deduction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => handleCalculate(employee)}
                      className="w-full"
                      size="sm"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Рассчитать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button onClick={calculateAll} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Рассчитать всех сотрудников
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Детальный расчет */}
      {calculation && selectedEmployee && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Расчет зарплаты: {selectedEmployee.name}
            </h2>
            <PayrollExport 
              employee={selectedEmployee} 
              calculation={calculation}
            />
          </div>
          
          <PayrollCalculationCard 
            employee={selectedEmployee} 
            calculation={calculation} 
          />
        </div>
      )}
    </div>
  )
}
