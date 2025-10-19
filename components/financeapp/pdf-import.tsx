"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle, FileText } from "lucide-react"
import { useFinance } from "@/lib/financeapp/finance-context"

export function PDFImport() {
  const { accounts, categories, counterparties, addTransaction, addAccount, addCategory, addCounterparty } = 
    useFinance()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [selectedBank, setSelectedBank] = useState("Kaspi")
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  function detectCategoryByText(text: string): string {
    const categories = {
      "Продажи Kaspi": ["kaspi.kz", "продажи", "kaspi qr"],
      "Оплата от клиента": ["оплата", "поступление", "услуги", "мониторинг", "видеонаблюдение", "камера", "договор"],
      "Налоги и сборы": ["налог", "гос", "казначейство"],
      "Перевод между счетами": ["своего счета", "перевод собственных средств"],
      "Платеж поставщику": ["оплата", "счет на оплату", "товар", "услуги", "поставка"],
      "Kaspi Pay комиссия": ["kaspi pay", "информационно-технологические услуги"],
      "Бензин / топливо": ["топливо", "гбо", "ai", "ai-92", "ai-95"],
      "Прочее": []
    }
    
    const t = text.toLowerCase()
    for (const [cat, words] of Object.entries(categories)) {
      if (words.some((w) => t.includes(w))) return cat
    }
    return "Прочее"
  }

  const parsePDFContent = async (file: File, bankName: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bankName', bankName)
    
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Ошибка при парсинге PDF')
    }
    
    const data = await response.json()
    return data.transactions
  }

  const handleImport = async () => {
    if (!file) return
    setStatus('processing')
    setMessage('Обработка PDF файла...')
    
    try {
      const transactions = await parsePDFContent(file, selectedBank)
      
      const account = accounts.find((a) => a.id === selectedAccountId)
      if (!account) {
        throw new Error('Выберите счет для импорта')
      }

      for (const tx of transactions) {
        // Определяем категорию
        let categoryName = detectCategoryByText(tx.comment)
        let category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) {
          category = addCategory({ 
            name: categoryName, 
            type: tx.type, 
            color: tx.type === 'income' ? '#10B981' : '#EF4444' 
          })
        }

        // Создаем контрагента если нужно
        let counterparty = counterparties.find((cp) => cp.name.toLowerCase() === tx.counterparty.toLowerCase())
        if (!counterparty && tx.counterparty) {
          counterparty = addCounterparty({ 
            name: tx.counterparty, 
            type: 'organization', 
            contactInfo: '' 
          })
        }

        addTransaction({
          accountId: account.id,
          amount: Math.abs(tx.amount),
          type: tx.type,
          date: tx.date,
          comment: tx.comment,
          categoryId: category?.id || '',
          counterpartyId: counterparty?.id || '',
          currency: account.currency,
        })
      }

      setStatus('success')
      setMessage(`Импортировано ${transactions.length} операций из PDF`)
      setFile(null)
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message || 'Ошибка импорта PDF')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Импорт по PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт транзакций из PDF</DialogTitle>
          <DialogDescription>
            Загрузите PDF файл банковской выписки для автоматического извлечения транзакций
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="pdf-file">PDF файл выписки</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="mt-1"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-1">
                Выбран: {file.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="account-select">Счет для импорта</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счет" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bank-select">Банк выписки</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите банк" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Kaspi">Kaspi Bank</SelectItem>
                <SelectItem value="Forte">Forte Bank</SelectItem>
                <SelectItem value="Onlinebank">Onlinebank</SelectItem>
                <SelectItem value="Halyk">Halyk Bank</SelectItem>
                <SelectItem value="Jusan">Jusan Bank</SelectItem>
                <SelectItem value="Other">Другой банк</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'processing' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!file || !selectedAccountId || status === 'processing'}
            >
              <Upload className="w-4 h-4 mr-2" />
              Импортировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
