"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { useFinance } from "@/lib/financeapp/finance-context"

export function StatementImport() {
  const { accounts, categories, counterparties, addTransaction, addAccount, addCategory, addCounterparty } = useFinance()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [bankName, setBankName] = useState("")
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  function detectFormat(rows: any[]): "forte" | "kaspi" | "1c" | "generic" {
    if (!rows || rows.length === 0) return "generic"
    const row = rows[0]
    const headers = Object.keys(row || {}).map((h) => h.toLowerCase())
    if (headers.some((h) => h.includes("күні/дата") || h.includes("дебет / дебет") || h.includes("кредит / кредит") || h.includes("назначение платежа"))) return "forte"
    if (headers.some((h) => h.includes("дата операции") || h.includes("сумма операции") || h.includes("сумма списания") || h.includes("сумма пополнения") || h.includes("описание операции") || h.includes("категория"))) return "kaspi"
    if (headers.some((h) => h === "дата" || h.includes("дебет") || h.includes("кредит") || h.includes("контрагент") || h.includes("назначение"))) return "1c"
    return "generic"
  }

  const parseForte = (data: any[]) => {
    const result: any[] = []
    data.forEach((row, index) => {
      try {
        const date = row['Күні/Дата'] || row['Дата'] || row['Date'] || row['date']
        const doc = row['Құжат Нөмірі/Номер документа'] || row['Номер документа'] || ''
        const sender = row['Жіберуші (Атауы, БСК, ЖСК, БСН/ЖСН) / Отправитель (Наименование, БИК, ИИК, БИН/ИИН)'] || ''
        const recipient = row['Алушы (Атауы, БСК, ЖСК, БСН/ЖСН) / Получатель (Наименование, БИК, ИИК, БИН/ИИН)'] || ''
        const debit = parseFloat((row['Дебет / Дебет'] || row['Дебет'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
        const credit = parseFloat((row['Кредит / Кредит'] || row['Кредит'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
        const description = row['Төлемнің тағайындалуы / Назначение платежа'] || ''

        let amount = 0
        let type: 'income' | 'expense' = 'expense'
        let counterpartyName = ''
        if (debit > 0 && credit === 0) { amount = debit; type = 'expense'; counterpartyName = recipient }
        else if (credit > 0 && debit === 0) { amount = credit; type = 'income'; counterpartyName = sender }
        else return
        if (!date || !amount) return

        let account = accounts.find(a => (bankName ? a.name.toLowerCase().includes(bankName.toLowerCase()) : (a.name.toLowerCase().includes('forte') || a.name.toLowerCase().includes('форте'))))
        if (!account) {
          account = addAccount({ name: bankName || 'ForteBank', type: 'bank', balance: 0, currency: 'KZT' })
        }

        let categoryName = type === 'income' ? 'Поступления' : 'Списания'
        if (String(description).toLowerCase().includes('зарплат')) categoryName = 'Зарплата'
        let category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) category = addCategory({ name: categoryName, type, color: type === 'income' ? '#10B981' : '#EF4444' })

        let counterparty = counterparties.find(cp => cp.name.toLowerCase() === String(counterpartyName).toLowerCase())
        if (!counterparty && counterpartyName) counterparty = addCounterparty({ name: counterpartyName, type: 'organization', contactInfo: '' })

        result.push({
          accountId: account.id,
          amount: Math.abs(amount),
          type,
          date: new Date(date).toISOString().split('T')[0],
          comment: `${description}${doc ? ` (Док: ${doc})` : ''}`,
          categoryId: category?.id || '',
          counterpartyId: counterparty?.id || '',
          currency: account.currency,
        })
      } catch {}
    })
    return result
  }

  const parseKaspi = (data: any[]) => {
    const result: any[] = []
    data.forEach((row) => {
      const date = row['Дата операции'] || row['Дата']
      const description = row['Описание операции'] || row['Описание'] || ''
      const amountSigned = parseFloat((row['Сумма'] || row['Сумма операции'] || '').toString().replace(/[^\d.,-]/g, '').replace(',', '.'))
      const debitKaspi = parseFloat((row['Сумма списания'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
      const creditKaspi = parseFloat((row['Сумма пополнения'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
      let amount = 0
      let type: 'income' | 'expense' = 'expense'
      if (!isNaN(amountSigned) && amountSigned !== 0) { amount = Math.abs(amountSigned); type = amountSigned > 0 ? 'income' : 'expense' }
      else if (creditKaspi > 0 || debitKaspi > 0) { amount = creditKaspi > 0 ? creditKaspi : debitKaspi; type = creditKaspi > 0 ? 'income' : 'expense' } else return
      if (!date || !amount) return
      let account = accounts.find(a => (bankName ? a.name.toLowerCase().includes(bankName.toLowerCase()) : a.name.toLowerCase().includes('kaspi')))
      if (!account) account = addAccount({ name: bankName || 'Kaspi', type: 'kaspi', balance: 0, currency: 'KZT' })
      const catName = type === 'income' ? 'Поступления (Kaspi)' : 'Списания (Kaspi)'
      let category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (!category) category = addCategory({ name: catName, type, color: type === 'income' ? '#10B981' : '#EF4444' })
      result.push({ accountId: account.id, amount, type, date: new Date(date).toISOString().split('T')[0], comment: description, categoryId: category?.id || '', counterpartyId: '', currency: account.currency })
    })
    return result
  }

  const parse1C = (data: any[]) => {
    const result: any[] = []
    data.forEach((row) => {
      const date = row['Дата'] || row['date']
      const debit = parseFloat((row['Дебет'] || row['Сумма дебета'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
      const credit = parseFloat((row['Кредит'] || row['Сумма кредита'] || '0').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
      const description = row['Назначение платежа'] || row['Комментарий'] || row['Описание'] || ''
      const counterpartyName = row['Контрагент'] || row['Организация'] || ''
      let amount = 0
      let type: 'income' | 'expense' = 'expense'
      if (debit > 0 && credit === 0) { amount = debit; type = 'expense' } else if (credit > 0 && debit === 0) { amount = credit; type = 'income' } else return
      if (!date || !amount) return
      let account = accounts.find(a => bankName ? a.name.toLowerCase().includes(bankName.toLowerCase()) : a.name.toLowerCase().includes('1c'))
      if (!account) account = addAccount({ name: bankName || '1C Bank', type: 'bank', balance: 0, currency: 'KZT' })
      const catName = type === 'income' ? 'Поступления (1C)' : 'Списания (1C)'
      let category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (!category) category = addCategory({ name: catName, type, color: type === 'income' ? '#10B981' : '#EF4444' })
      let counterparty = counterparties.find(cp => cp.name.toLowerCase() === String(counterpartyName).toLowerCase())
      if (!counterparty && counterpartyName) counterparty = addCounterparty({ name: counterpartyName, type: 'organization', contactInfo: '' })
      result.push({ accountId: account.id, amount, type, date: new Date(date).toISOString().split('T')[0], comment: description, categoryId: category?.id || '', counterpartyId: counterparty?.id || '', currency: account.currency })
    })
    return result
  }

  const process = (rows: any[]) => {
    const fmt = detectFormat(rows)
    if (fmt === 'forte') return parseForte(rows)
    if (fmt === 'kaspi') return parseKaspi(rows)
    if (fmt === '1c') return parse1C(rows)
    return []
  }

  const handleImport = async () => {
    if (!file) return
    setStatus('processing')
    setMessage('Обработка файла...')
    try {
      let rows: any[] = []
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'csv') {
        const text = await file.text()
        rows = Papa.parse(text, { header: true }).data as any[]
      } else {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(ws)
      }
      const txs = process(rows)
      txs.forEach((t) => addTransaction(t))
      setStatus('success')
      setMessage(`Импортировано ${txs.length} операций`)
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message || 'Ошибка импорта')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Импорт по выписке
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импорт по выписке</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bank-name">Наименование банка</Label>
            <Input id="bank-name" placeholder="Например: ForteBank, Kaspi, 1C" value={bankName} onChange={(e) => setBankName(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="statement-file">Файл выписки</Label>
            <Input id="statement-file" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="mt-2" />
          </div>
          {status === 'processing' && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Обработка файла...
            </div>
          )}
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{message}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={!file || status === 'processing'}>Импортировать</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Закрыть</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


