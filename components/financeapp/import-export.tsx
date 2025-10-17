"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useFinance } from "@/lib/financeapp/finance-context"
import { formatCurrency } from "@/lib/financeapp/finance-utils"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface ImportExportProps {
  onImportComplete?: () => void
}

export function ImportExport({ onImportComplete }: ImportExportProps) {
  const { accounts, transactions, addTransaction, categories, counterparties, addCategory, addCounterparty, addAccount } = useFinance()
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importType, setImportType] = useState<"excel" | "csv">("excel")
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")
  const [importedCount, setImportedCount] = useState(0)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'csv') {
        setImportType("csv")
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        setImportType("excel")
      }
    }
  }

  const processImportData = (data: any[]) => {
    const processedTransactions: any[] = []
    
    data.forEach((row, index) => {
      try {
        // Парсинг банковской выписки ForteBank
        const date = row['Күні/Дата'] || row['Дата'] || row['Date'] || row['date']
        const documentNumber = row['Құжат Нөмірі/Номер документа'] || row['Номер документа'] || row['Document Number'] || ''
        const sender = row['Жіберуші (Атауы, БСК, ЖСК, БСН/ЖСН) / Отправитель (Наименование, БИК, ИИК, БИН/ИИН)'] || row['Отправитель'] || row['Sender'] || ''
        const recipient = row['Алушы (Атауы, БСК, ЖСК, БСН/ЖСН) / Получатель (Наименование, БИК, ИИК, БИН/ИИН)'] || row['Получатель'] || row['Recipient'] || ''
        const debit = parseFloat((row['Дебет / Дебет'] || row['Дебет'] || row['Debit'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
        const credit = parseFloat((row['Кредит / Кредит'] || row['Кредит'] || row['Credit'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
        const description = row['Төлемнің тағайындалуы / Назначение платежа'] || row['Назначение платежа'] || row['Purpose'] || row['Description'] || ''
        const rate = row['Бағам/Курс'] || row['Курс'] || row['Rate'] || '1.00'

        // Определяем тип транзакции и сумму
        let amount = 0
        let type = 'expense'
        let counterpartyName = ''

        if (debit > 0 && credit === 0) {
          // Расход (дебет)
          amount = debit
          type = 'expense'
          counterpartyName = recipient
        } else if (credit > 0 && debit === 0) {
          // Доход (кредит)
          amount = credit
          type = 'income'
          counterpartyName = sender
        } else {
          return // Пропускаем строки без операций
        }

        if (!date || !amount) {
          return // Пропускаем строки без обязательных полей
        }

        // Находим счет ForteBank или создаем его
        let account = accounts.find(a => a.name.toLowerCase().includes('forte') || a.name.toLowerCase().includes('форте'))
        if (!account) {
          // Создаем счет ForteBank если его нет
          account = addAccount({
            name: 'ForteBank',
            type: 'bank',
            balance: 0,
            currency: 'KZT',
            accountNumber: 'KZ9496511F0008314291'
          })
        }

        // Определяем категорию на основе описания
        let categoryName = 'Прочие'
        if (description.toLowerCase().includes('зарплат') || description.toLowerCase().includes('зп')) {
          categoryName = 'Зарплата'
        } else if (description.toLowerCase().includes('гарантийн') || description.toLowerCase().includes('взнос')) {
          categoryName = 'Гарантийные взносы'
        } else if (description.toLowerCase().includes('услуг') || description.toLowerCase().includes('обслуживани')) {
          categoryName = 'Услуги'
        } else if (description.toLowerCase().includes('материал') || description.toLowerCase().includes('товар')) {
          categoryName = 'Материалы'
        }

        // Находим или создаем категорию
        let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) {
          category = addCategory({
            name: categoryName,
            type: type === 'income' ? 'income' : 'expense',
            color: type === 'income' ? '#10B981' : '#EF4444'
          })
        }

        // Находим или создаем контрагента
        let counterparty = counterparties.find(cp => cp.name.toLowerCase() === counterpartyName.toLowerCase())
        if (!counterparty && counterpartyName) {
          counterparty = addCounterparty({
            name: counterpartyName,
            type: 'organization' as const,
            contactInfo: ''
          })
        }

        const transaction = {
          accountId: account.id,
          amount: Math.abs(amount),
          type: type as 'income' | 'expense',
          date: new Date(date).toISOString().split('T')[0],
          comment: `${description}${documentNumber ? ` (Док: ${documentNumber})` : ''}`,
          categoryId: category?.id || '',
          counterpartyId: counterparty?.id || '',
          currency: 'KZT'
        }

        processedTransactions.push(transaction)
      } catch (error) {
        console.error(`Ошибка обработки строки ${index + 1}:`, error)
      }
    })

    return processedTransactions
  }

  const handleImport = async () => {
    if (!importFile) return

    setImportStatus("processing")
    setImportMessage("Обработка файла...")

    try {
      let data: any[] = []

      if (importType === "excel") {
        const arrayBuffer = await importFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)
      } else {
        const text = await importFile.text()
        data = Papa.parse(text, { header: true }).data as any[]
      }

      const processedTransactions = processImportData(data)
      
      // Добавляем транзакции
      processedTransactions.forEach(transaction => {
        addTransaction(transaction)
      })

      setImportedCount(processedTransactions.length)
      setImportStatus("success")
      setImportMessage(`Успешно импортировано ${processedTransactions.length} транзакций`)
      
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error) {
      setImportStatus("error")
      setImportMessage(`Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleExport = () => {
    const exportData = transactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.accountId)
      const category = categories.find(c => c.id === transaction.categoryId)
      const counterparty = counterparties.find(cp => cp.id === transaction.counterpartyId)
      
      return {
        'Дата': transaction.date,
        'Сумма': transaction.amount,
        'Тип': transaction.type === 'income' ? 'Доход' : 'Расход',
        'Описание': transaction.comment || '',
        'Счет': account?.name || '',
        'Категория': category?.name || '',
        'Контрагент': counterparty?.name || '',
        'Валюта': transaction.currency
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Транзакции")
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        'Күні/Дата': '01.10.2025 14:59:11',
        'Құжат Нөмірі/Номер документа': '71',
        'Жіберуші (Атауы, БСК, ЖСК, БСН/ЖСН) / Отправитель (Наименование, БИК, ИИК, БИН/ИИН)': 'Alchin',
        'Алушы (Атауы, БСК, ЖСК, БСН/ЖСН) / Получатель (Наименование, БИК, ИИК, БИН/ИИН)': 'Акционерное общество "Центр электронных финансов"',
        'Дебет / Дебет': '30 000,00',
        'Кредит / Кредит': '0,00',
        'Төлемнің тағайындалуы / Назначение платежа': 'Гарантийный взнос. ИП Alchin 960821350108',
        'Бағам/Курс': '1.00'
      },
      {
        'Күні/Дата': '01.10.2025 11:14:01',
        'Құжат Нөмірі/Номер документа': '153784921',
        'Жіберуші (Атауы, БСК, ЖСК, БСН/ЖСН) / Отправитель (Наименование, БИК, ИИК, БИН/ИИН)': 'Коммунальное государственное учреждение "Детско-юношеская спортивная школа села Тенге"',
        'Алушы (Атауы, БСК, ЖСК, БСН/ЖСН) / Получатель (Наименование, БИК, ИИК, БИН/ИИН)': 'ИП Alchin ЦУРИЕВ ЧЕНГИСХАН ДЖАМАЛАЙЛОВИЧ',
        'Дебет / Дебет': '0,00',
        'Кредит / Кредит': '14 600,00',
        'Төлемнің тағайындалуы / Назначение платежа': 'СФ# 2852781/25-534 за 01.10.2025 ЗП#. Услуги по техническому обслуживанию видеонаблюдения за август месяц 2025г.',
        'Бағам/Курс': '1.00'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "ForteBank Шаблон")
    XLSX.writeFile(wb, "fortebank_template.xlsx")
  }

  return (
    <div className="flex gap-4">
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Импорт
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Импорт транзакций</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Выберите файл</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Поддерживаются форматы: Excel (.xlsx, .xls) и CSV (.csv)
              </p>
            </div>

            {importFile && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Поддерживается формат банковской выписки ForteBank:</strong><br />
                    Күні/Дата, Дебет/Кредит, Отправитель/Получатель, Назначение платежа<br />
                    <strong>Или стандартный формат:</strong><br />
                    Дата, Сумма, Тип, Описание, Счет, Категория, Контрагент
                  </AlertDescription>
                </Alert>

                {importStatus === "processing" && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Обработка файла...
                  </div>
                )}

                {importStatus === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {importMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {importStatus === "error" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {importMessage}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={importStatus === "processing"}>
                    Импортировать
                  </Button>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Экспорт транзакций</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Экспортировать {transactions.length} транзакций в Excel файл
            </p>
            <div className="flex gap-2">
              <Button onClick={handleExport}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Скачать Excel
              </Button>
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Шаблон
      </Button>
    </div>
  )
}
