"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, FilePdf } from "lucide-react"
import { PayrollCalculation, EmployeePayrollData, formatCurrency } from "@/lib/payroll-calculator"

interface PayrollExportProps {
  employee: EmployeePayrollData
  calculation: PayrollCalculation
  employees?: EmployeePayrollData[]
  calculations?: PayrollCalculation[]
}

export function PayrollExport({ 
  employee, 
  calculation, 
  employees = [], 
  calculations = [] 
}: PayrollExportProps) {
  
  const exportToCSV = () => {
    const csvContent = generateCSV(employee, calculation)
    downloadFile(csvContent, `${employee.name}_payroll.csv`, 'text/csv')
  }

  const exportToExcel = () => {
    // Для Excel можно использовать библиотеку xlsx или создать CSV с расширением .xlsx
    const csvContent = generateCSV(employee, calculation)
    downloadFile(csvContent, `${employee.name}_payroll.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  }

  const exportToPDF = () => {
    const pdfContent = generatePDF(employee, calculation)
    downloadFile(pdfContent, `${employee.name}_payroll.pdf`, 'application/pdf')
  }

  const exportAllToCSV = () => {
    if (employees.length === 0 || calculations.length === 0) return
    
    const csvContent = generateAllCSV(employees, calculations)
    downloadFile(csvContent, `all_employees_payroll.csv`, 'text/csv')
  }

  const generateCSV = (emp: EmployeePayrollData, calc: PayrollCalculation): string => {
    const headers = [
      'ФИО',
      'Категория',
      'Зарплата',
      'ОПВ',
      'ВОСМС',
      'ИПН',
      'ООСМС',
      'СО',
      'СН',
      'ОППВ',
      'ОПВР',
      'Итого удержаний',
      'Итого отчислений',
      'К выплате'
    ]

    const row = [
      emp.name,
      emp.category,
      formatCurrency(calc.grossSalary),
      formatCurrency(calc.employeeDeductions.opv),
      formatCurrency(calc.employeeDeductions.vosms),
      formatCurrency(calc.employeeDeductions.ipn),
      formatCurrency(calc.employerContributions.oosms),
      formatCurrency(calc.employerContributions.so),
      formatCurrency(calc.employerContributions.sn),
      formatCurrency(calc.employerContributions.oppv),
      formatCurrency(calc.employerContributions.opvr),
      formatCurrency(calc.totalEmployeeDeductions),
      formatCurrency(calc.totalEmployerContributions),
      formatCurrency(calc.netSalary)
    ]

    return [headers.join(','), row.join(',')].join('\n')
  }

  const generateAllCSV = (emps: EmployeePayrollData[], calcs: PayrollCalculation[]): string => {
    const headers = [
      'ФИО',
      'Категория',
      'Зарплата',
      'ОПВ',
      'ВОСМС',
      'ИПН',
      'ООСМС',
      'СО',
      'СН',
      'ОППВ',
      'ОПВР',
      'Итого удержаний',
      'Итого отчислений',
      'К выплате'
    ]

    const rows = emps.map((emp, index) => {
      const calc = calcs[index]
      if (!calc) return null
      
      return [
        emp.name,
        emp.category,
        formatCurrency(calc.grossSalary),
        formatCurrency(calc.employeeDeductions.opv),
        formatCurrency(calc.employeeDeductions.vosms),
        formatCurrency(calc.employeeDeductions.ipn),
        formatCurrency(calc.employerContributions.oosms),
        formatCurrency(calc.employerContributions.so),
        formatCurrency(calc.employerContributions.sn),
        formatCurrency(calc.employerContributions.oppv),
        formatCurrency(calc.employerContributions.opvr),
        formatCurrency(calc.totalEmployeeDeductions),
        formatCurrency(calc.totalEmployerContributions),
        formatCurrency(calc.netSalary)
      ].join(',')
    }).filter(Boolean)

    return [headers.join(','), ...rows].join('\n')
  }

  const generatePDF = (emp: EmployeePayrollData, calc: PayrollCalculation): string => {
    // Простая HTML-версия для PDF (можно использовать библиотеку jsPDF)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Расчет заработной платы - ${emp.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-weight: bold; background-color: #f9f9f9; }
          .amount { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Расчет заработной платы</h1>
          <h2>${emp.name}</h2>
          <p>Категория: ${emp.category}</p>
        </div>

        <div class="section">
          <h3>Основная информация</h3>
          <table>
            <tr><td>Зарплата</td><td class="amount">${formatCurrency(calc.grossSalary)}</td></tr>
            <tr><td>К выплате</td><td class="amount">${formatCurrency(calc.netSalary)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Удержания с сотрудника</h3>
          <table>
            <tr><td>ОПВ (10%)</td><td class="amount">${formatCurrency(calc.employeeDeductions.opv)}</td></tr>
            <tr><td>ВОСМС (2%)</td><td class="amount">${formatCurrency(calc.employeeDeductions.vosms)}</td></tr>
            <tr><td>ИПН (10%)</td><td class="amount">${formatCurrency(calc.employeeDeductions.ipn)}</td></tr>
            <tr class="total"><td>Итого удержаний</td><td class="amount">${formatCurrency(calc.totalEmployeeDeductions)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Отчисления работодателя</h3>
          <table>
            <tr><td>ООСМС (3%)</td><td class="amount">${formatCurrency(calc.employerContributions.oosms)}</td></tr>
            <tr><td>СО (5%)</td><td class="amount">${formatCurrency(calc.employerContributions.so)}</td></tr>
            <tr><td>СН (11%)</td><td class="amount">${formatCurrency(calc.employerContributions.sn)}</td></tr>
            <tr><td>ОППВ (5%)</td><td class="amount">${formatCurrency(calc.employerContributions.oppv)}</td></tr>
            <tr><td>ОПВР (2,5%)</td><td class="amount">${formatCurrency(calc.employerContributions.opvr)}</td></tr>
            <tr class="total"><td>Итого отчислений</td><td class="amount">${formatCurrency(calc.totalEmployerContributions)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Налоговые вычеты</h3>
          <table>
            <tr><td>Стандартный вычет (14 МРП)</td><td class="amount">${formatCurrency(calc.taxDeductions.standardMrp)}</td></tr>
            <tr><td>Вычет по ОПВ</td><td class="amount">${formatCurrency(calc.taxDeductions.opvDeduction)}</td></tr>
            <tr><td>Вычет по ВОСМС</td><td class="amount">${formatCurrency(calc.taxDeductions.vosmsDeduction)}</td></tr>
            <tr><td>Дополнительные вычеты</td><td class="amount">${formatCurrency(calc.taxDeductions.additionalDeductions)}</td></tr>
            <tr class="total"><td>Общая сумма вычетов</td><td class="amount">${formatCurrency(calc.taxDeductions.totalDeductions)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Детализация расчета ИПН</h3>
          <table>
            <tr><td>Облагаемый доход</td><td class="amount">${formatCurrency(calc.ipnCalculation.taxableIncome)}</td></tr>
            <tr><td>Примененные вычеты</td><td class="amount">${formatCurrency(calc.ipnCalculation.appliedDeductions)}</td></tr>
            <tr><td>Доход после вычетов</td><td class="amount">${formatCurrency(calc.ipnCalculation.incomeAfterDeductions)}</td></tr>
            ${calc.ipnCalculation.ninetyPercentAdjustment > 0 ? 
              `<tr><td>Корректировка на 90%</td><td class="amount">${formatCurrency(calc.ipnCalculation.ninetyPercentAdjustment)}</td></tr>` : ''}
            <tr><td>Итоговый облагаемый доход</td><td class="amount">${formatCurrency(calc.ipnCalculation.finalTaxableIncome)}</td></tr>
            <tr class="total"><td>ИПН (10%)</td><td class="amount">${formatCurrency(calc.ipnCalculation.ipnAmount)}</td></tr>
          </table>
        </div>
      </body>
      </html>
    `
    
    return html
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FilePdf className="w-4 h-4 mr-2" />
          PDF
        </DropdownMenuItem>
        {employees.length > 0 && calculations.length > 0 && (
          <>
            <DropdownMenuItem onClick={exportAllToCSV}>
              <FileText className="w-4 h-4 mr-2" />
              Все сотрудники (CSV)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
