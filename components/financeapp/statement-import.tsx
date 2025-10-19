"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { useFinance } from "@/lib/financeapp/finance-context"
import type { Category } from "@/lib/financeapp/types"

export function StatementImport() {
  const { accounts, categories, counterparties, transactions, addTransaction, addAccount, addCategory, addCounterparty } = useFinance()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [selectedAccountId, setSelectedAccountId] = useState("")
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
        let type: 'income' | 'expense' | 'transfer' = 'expense'
        let counterpartyName = ''
        if (debit > 0 && credit === 0) { amount = debit; type = 'expense'; counterpartyName = recipient }
        else if (credit > 0 && debit === 0) { amount = credit; type = 'income'; counterpartyName = sender }
        else return
        if (!date || !amount) return

        const account = accounts.find(a => a.id === selectedAccountId) || accounts.find(a => a.type === 'bank') || accounts[0]
        if (!account) return

        let categoryName = type === 'income' ? 'Поступления' : 'Списания'
        if (String(description).toLowerCase().includes('зарплат')) categoryName = 'Зарплата'
        let category: Category | undefined = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) {
          category = addCategory({ name: categoryName, type, color: type === 'income' ? '#10B981' : '#EF4444' }) as Category
        }

        let counterparty = counterparties.find(cp => cp.name.toLowerCase() === String(counterpartyName).toLowerCase())
        if (!counterparty && counterpartyName) counterparty = addCounterparty({ name: counterpartyName, type: 'supplier' })

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
      let type: 'income' | 'expense' | 'transfer' = 'expense'
      if (!isNaN(amountSigned) && amountSigned !== 0) { amount = Math.abs(amountSigned); type = amountSigned > 0 ? 'income' : 'expense' }
      else if (creditKaspi > 0 || debitKaspi > 0) { amount = creditKaspi > 0 ? creditKaspi : debitKaspi; type = creditKaspi > 0 ? 'income' : 'expense' } else return
      if (!date || !amount) return
      const account = accounts.find(a => a.id === selectedAccountId) || accounts.find(a => a.type === 'bank') || accounts[0]
      if (!account) return
      const catName = type === 'income' ? 'Поступления (Kaspi)' : 'Списания (Kaspi)'
      let category: Category | undefined = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (!category) {
        category = addCategory({ name: catName, type, color: type === 'income' ? '#10B981' : '#EF4444' }) as Category
      }
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
      let type: 'income' | 'expense' | 'transfer' = 'expense'
      if (debit > 0 && credit === 0) { amount = debit; type = 'expense' } else if (credit > 0 && debit === 0) { amount = credit; type = 'income' } else return
      if (!date || !amount) return
      const account = accounts.find(a => a.id === selectedAccountId) || accounts.find(a => a.type === 'bank') || accounts[0]
      if (!account) return
      const catName = type === 'income' ? 'Поступления (1C)' : 'Списания (1C)'
      let category: Category | undefined = categories.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (!category) {
        category = addCategory({ name: catName, type, color: type === 'income' ? '#10B981' : '#EF4444' }) as Category
      }
      let counterparty = counterparties.find(cp => cp.name.toLowerCase() === String(counterpartyName).toLowerCase())
      if (!counterparty && counterpartyName) counterparty = addCounterparty({ name: counterpartyName, type: 'supplier' })
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

  // --- Импорт 1CClientBankExchange (.txt) ---
  const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "Продажи Kaspi": ["kaspi.kz", "продажи", "kaspi qr"],
    "Оплата от клиента": ["оплата", "поступление", "услуги", "мониторинг", "видеонаблюдение", "камера", "договор"],
    "Налоги и сборы": ["налог", "гос", "казначейство"],
    "Перевод между счетами": ["своего счета", "перевод собственных средств"],
    "Платеж поставщику": ["оплата", "счет на оплату", "товар", "услуги", "лизинг", "поставка"],
    "Kaspi Pay комиссия": ["информационно-технологические услуги", "kaspi pay"],
    "Бензин / топливо": ["гбо", "топливо", "нефть", "ai", "ai-92", "ai-95"],
    "Прочее": []
  }

  function detectCategoryByText(text: string): string {
    const t = (text || '').toLowerCase()
    for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
      if (words.some((w) => t.includes(w))) return cat
    }
    return "Прочее"
  }

  // Функция для сопоставления ИИК из выписки с существующими счетами
  function findMatchingAccountByIIK(accountIIK: string): string | null {
    if (!accountIIK || accountIIK.trim() === '') return null
    
    const iikTrimmed = accountIIK.trim()
    
    // Ищем счет с соответствующим номером счета (ИИК)
    const matchingAccount = accounts.find(account => {
      if (!account.accountNumber) return false
      
      // Сравниваем ИИК напрямую
      if (account.accountNumber.trim() === iikTrimmed) {
        return true
      }
      
      // Также проверяем частичное совпадение (на случай разных форматов)
      const accountNumber = account.accountNumber.replace(/\s+/g, '')
      const iikClean = iikTrimmed.replace(/\s+/g, '')
      
      return accountNumber === iikClean
    })
    
    return matchingAccount ? matchingAccount.name : null
  }

  // Функция для поиска счета по ИИК (возвращает объект счета)
  function findAccountByIIK(accountIIK: string): any | null {
    if (!accountIIK || accountIIK.trim() === '') return null
    
    const iikTrimmed = accountIIK.trim()
    
    // Ищем счет с соответствующим номером счета (ИИК)
    const matchingAccount = accounts.find(account => {
      if (!account.accountNumber) return false
      
      // Сравниваем ИИК напрямую
      if (account.accountNumber.trim() === iikTrimmed) {
        return true
      }
      
      // Также проверяем частичное совпадение (на случай разных форматов)
      const accountNumber = account.accountNumber.replace(/\s+/g, '')
      const iikClean = iikTrimmed.replace(/\s+/g, '')
      
      return accountNumber === iikClean
    })
    
    return matchingAccount || null
  }

  // Функция для проверки существующих транзакций по номеру документа
  function isTransactionExists(documentNumber: string): boolean {
    if (!documentNumber || documentNumber.trim() === '') return false
    
    return transactions.some(transaction => 
      transaction.documentNumber === documentNumber.trim()
    )
  }

  // Функция для тестирования логики определения типа транзакции
  function testTransactionType(payerIIK: string, receiverIIK: string): string {
    const isPayerOurAccount = accounts.some(acc => acc.accountNumber === payerIIK)
    const isReceiverOurAccount = accounts.some(acc => acc.accountNumber === receiverIIK)
    
    if (isPayerOurAccount && isReceiverOurAccount) {
      return 'transfer'
    } else if (isPayerOurAccount) {
      return 'expense'
    } else if (isReceiverOurAccount) {
      return 'income'
    } else {
      return 'unknown'
    }
  }

  const parse1CClientBankExchangeTxt = (content: string) => {
    // Пытаемся извлечь контрольные суммы из выписки: ВсегоПоступило / ВсегоСписано
    const num = (s: string | undefined | null): number => {
      if (!s) return 0
      return parseFloat(s.replace(/\s+/g, '').replace(',', '.')) || 0
    }
    const receivedMatch = content.match(/ВсегоПоступило\s*[:=]\s*([0-9\s.,]+)/i)
    const spentMatch = content.match(/ВсегоСписано\s*[:=]\s*([0-9\s.,]+)/i)
    const totals = {
      received: num(receivedMatch?.[1]),
      spent: num(spentMatch?.[1]),
      present: Boolean(receivedMatch || spentMatch),
    }
    const results: any[] = []
    const seenTransactions = new Set<string>() // Для отслеживания дубликатов
    const duplicateCount = { count: 0 } // Счетчик дубликатов
    
    console.log('🚀 Начинаем парсинг 1CClientBankExchange файла')
    console.log('📊 Доступные счета в системе:', accounts.map(acc => ({ 
      name: acc.name, 
      accountNumber: acc.accountNumber,
      hasAccountNumber: !!acc.accountNumber 
    })))
    
    // Разбиваем по операциям
    const blocks = content.split(/СекцияДокумент=/i).slice(1)
    console.log(`📄 Найдено блоков документов: ${blocks.length}`)
    
    blocks.forEach((block, blockIndex) => {
      try {
        console.log(`\n📋 Обрабатываем блок ${blockIndex + 1}:`)
        
        // Дата (пробуем разные варианты)
        let dateMatch = block.match(/ДатаОперации=(.+)/i)
        if (!dateMatch) {
          dateMatch = block.match(/ДатаДокумента=(.+)/i)
        }
        const date = dateMatch?.[1]?.trim() || ''

        // Сумма и тип операции (пробуем разные варианты)
        const incomeMatch = block.match(/СуммаПриход=(.+)/i)
        const expenseMatch = block.match(/СуммаРасход=(.+)/i)
        const incomeAlt = block.match(/СуммаДоход=(.+)/i) // Forte вариант
        const sumMatch = block.match(/Сумма=(.+)/i)

        let type: 'income' | 'expense' | 'transfer' | undefined
        let amount = 0

        if (incomeMatch || incomeAlt) {
          const amountStr = (incomeMatch || incomeAlt)![1]
          amount = parseFloat(amountStr.replace(',', '.'))
          type = 'income'
        } else if (expenseMatch) {
          const amountStr = expenseMatch[1]
          amount = parseFloat(amountStr.replace(',', '.'))
          type = 'expense'
        } else if (sumMatch) {
          const raw = sumMatch[1].trim().replace(',', '.')
          if (/^\d+\.?\d*$/.test(raw)) {
            // Получаем ИИК для определения типа транзакции
            const payerIIK = block.match(/ПлательщикИИК=(.+)/i)
            const receiverIIK = block.match(/ПолучательИИК=(.+)/i)
            
            const payerIIKValue = payerIIK?.[1]?.trim() || ''
            const receiverIIKValue = receiverIIK?.[1]?.trim() || ''
            
            // Проверяем, какие номера счетов принадлежат нашим счетам
            const normalize = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
            const payerNorm = normalize(payerIIKValue)
            const receiverNorm = normalize(receiverIIKValue)
            const isPayerOurAccount = accounts.some(acc => acc.accountNumber && normalize(acc.accountNumber) === payerNorm)
            const isReceiverOurAccount = accounts.some(acc => acc.accountNumber && normalize(acc.accountNumber) === receiverNorm)
            
            console.log(`🔍 Анализ ИИК:`)
            console.log(`  Плательщик ИИК: "${payerIIKValue}"`)
            console.log(`  Получатель ИИК: "${receiverIIKValue}"`)
            console.log(`  Плательщик наш счет: ${isPayerOurAccount}`)
            console.log(`  Получатель наш счет: ${isReceiverOurAccount}`)
            console.log(`  Доступные счета в системе:`, accounts.map(acc => ({ name: acc.name, accountNumber: acc.accountNumber })))
            
            // Детальная проверка каждого счета
            console.log(`🔍 Детальная проверка счетов:`)
            accounts.forEach(acc => {
              if (acc.accountNumber) {
                const accountNumber = acc.accountNumber.trim()
                const payerMatch = accountNumber === payerIIKValue.trim() || accountNumber.replace(/\s+/g, '') === payerIIKValue.replace(/\s+/g, '')
                const receiverMatch = accountNumber === receiverIIKValue.trim() || accountNumber.replace(/\s+/g, '') === receiverIIKValue.replace(/\s+/g, '')
                console.log(`  Счет "${acc.name}" (${accountNumber}):`)
                console.log(`    Совпадает с плательщиком: ${payerMatch}`)
                console.log(`    Совпадает с получателем: ${receiverMatch}`)
              } else {
                console.log(`  Счет "${acc.name}": НЕТ НОМЕРА СЧЕТА`)
              }
            })
            
            // ✅ ОСНОВНАЯ ЛОГИКА: Если оба ИИК - наши счета, то это ПЕРЕВОД
            if (isPayerOurAccount && isReceiverOurAccount) {
              type = 'transfer'
              console.log('✅ Определен тип: TRANSFER (перевод между своими счетами)')
              console.log(`🔍 Детали: Плательщик "${payerIIKValue}" и Получатель "${receiverIIKValue}" - оба наши счета`)
            } else if (isPayerOurAccount) {
              type = 'expense'
              console.log('✅ Определен тип: EXPENSE (расход с нашего счета по IIK)')
            } else if (isReceiverOurAccount) {
              type = 'income'
              console.log('✅ Определен тип: INCOME (доход на наш счет по IIK)')
            } else {
              // Fallback: используем старую логику по имени
              const payer = block.match(/ПлательщикНаименование=(.+)/i)
              if (payer && /alchin/i.test(payer[1])) {
                type = 'expense'
                console.log('⚠️ Определен тип: EXPENSE (по имени плательщика - fallback)')
              } else {
                type = 'income'
                console.log('⚠️ Определен тип: INCOME (по умолчанию - fallback)')
              }
            }
            
            console.log(`🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: тип транзакции = "${type}"`)
            amount = parseFloat(raw)
          } else {
            return // пропускаем если не число
          }
        }

        if (!type || !date || !amount) return

        // Контрагент и назначение
        const payer = block.match(/ПлательщикНаименование=(.+)/i)
        const receiver = block.match(/ПолучательНаименование=(.+)/i)
        const purpose = block.match(/НазначениеПлатежа=(.+)/i)
        
        // ИИК данные и номер документа
        const payerIIK = block.match(/ПлательщикИИК=(.+)/i)
        const receiverIIK = block.match(/ПолучательИИК=(.+)/i)
        const documentNumber = block.match(/НомерДокумента=(.+)/i)

        const payerName = payer?.[1]?.trim() || ''
        const receiverName = receiver?.[1]?.trim() || ''
        const purposeText = purpose?.[1]?.trim() || ''
        const payerIIKValue = payerIIK?.[1]?.trim() || ''
        const receiverIIKValue = receiverIIK?.[1]?.trim() || ''
        const documentNumberValue = documentNumber?.[1]?.trim() || ''
        
        console.log(`Имена: Плательщик="${payerName}", Получатель="${receiverName}"`)

        // Определяем контрагента и счет в зависимости от типа транзакции
        let counterpartyName = ''
        let accountIIK = ''
        let toAccountIIK = ''
        
        if (type === 'transfer') {
          // ✅ Для переводов: контрагент - это название перевода, счет откуда - плательщик, счет куда - получатель
          counterpartyName = `Перевод между счетами`
          // Для переводов определяем счета по ИИК
          const payerIsOurAccount = accounts.some(acc => {
            if (!acc.accountNumber) return false
            const accountNumber = acc.accountNumber.trim()
            const payerIIK = payerIIKValue.trim()
            return accountNumber === payerIIK || 
                   accountNumber.replace(/\s+/g, '') === payerIIK.replace(/\s+/g, '')
          })
          const receiverIsOurAccount = accounts.some(acc => {
            if (!acc.accountNumber) return false
            const accountNumber = acc.accountNumber.trim()
            const receiverIIK = receiverIIKValue.trim()
            return accountNumber === receiverIIK || 
                   accountNumber.replace(/\s+/g, '') === receiverIIK.replace(/\s+/g, '')
          })
          
          if (payerIsOurAccount && receiverIsOurAccount) {
            accountIIK = payerIIKValue // Счет откуда
            toAccountIIK = receiverIIKValue // Счет куда
          } else {
            // Если только один счет наш, используем его как основной
            accountIIK = payerIsOurAccount ? payerIIKValue : receiverIIKValue
            toAccountIIK = payerIsOurAccount ? receiverIIKValue : payerIIKValue
          }
          console.log(`🔄 ПЕРЕВОД: ${accountIIK} → ${toAccountIIK}, контрагент: ${counterpartyName}`)
        } else if (type === 'income') {
          // Для доходов: контрагент - плательщик, счет - получатель (наш счет)
          counterpartyName = payerName
          accountIIK = receiverIIKValue
          console.log(`💰 ДОХОД: контрагент ${counterpartyName}, счет ${accountIIK}`)
        } else if (type === 'expense') {
          // Для расходов: контрагент - получатель, счет - плательщик (наш счет)
          counterpartyName = receiverName
          accountIIK = payerIIKValue
          console.log(`💸 РАСХОД: контрагент ${counterpartyName}, счет ${accountIIK}`)
        }

        // Исключаем записи без контрагента или с пустыми полями
        if (!counterpartyName || counterpartyName.trim() === '' || counterpartyName === '-') {
          return
        }

        // ✅ Исключаем внутренние переводы (только для доходов/расходов, не для переводов)
        // Но сначала проверяем, не является ли это переводом между нашими счетами
        if (type !== 'transfer' && (counterpartyName.toLowerCase().includes('alchin') || purposeText.toLowerCase().includes('своего счета'))) {
          console.log(`⚠️ Пропущен внутренний перевод: ${counterpartyName} - ${purposeText}`)
          return
        }

        // Автоматически определяем счет по ИИК
        const account = findAccountByIIK(accountIIK)
        if (!account) {
          console.warn(`Не найден счет для ИИК: ${accountIIK}`)
          return
        }
        
        // Для переводов также определяем счет получателя
        let toAccount = null
        if (type === 'transfer') {
          toAccount = findAccountByIIK(toAccountIIK)
          if (!toAccount) {
            console.warn(`Не найден счет получателя для ИИК: ${toAccountIIK}`)
            return
          }
        }

        // Определяем категорию
        let categoryName = detectCategoryByText(purposeText)
        
        // ✅ Для переводов используем специальную категорию
        if (type === 'transfer') {
          categoryName = 'Перевод между счетами'
        }

        let category: Category | undefined = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) {
          category = addCategory({ 
            name: categoryName, 
            type: type, // Используем тип транзакции (включая transfer)
            color: type === 'income' ? '#10B981' : type === 'transfer' ? '#3B82F6' : '#EF4444' 
          }) as Category
          console.log(`📁 Создана новая категория: "${categoryName}" (тип: ${type})`)
        }

        // Создаем контрагента если нужно
        let counterparty = counterparties.find((cp) => cp.name.toLowerCase() === counterpartyName.toLowerCase())
        if (!counterparty && counterpartyName) {
          counterparty = addCounterparty({ 
            name: counterpartyName, 
            type: 'supplier'
          })
          console.log(`👤 Создан новый контрагент: "${counterpartyName}"`)
        }

        // Создаем уникальный ключ для проверки дубликатов по номеру документа
        const transactionKey = documentNumberValue || `${date}_${counterpartyName}_${type}`
        
        // Проверяем, не встречалась ли уже такая транзакция в файле
        if (seenTransactions.has(transactionKey)) {
          console.log(`Пропущен дубликат в файле: ${documentNumberValue || 'без номера'} - ${date} - ${counterpartyName}`)
          duplicateCount.count++
          return
        }
        
        // Проверяем существующие транзакции в базе данных
        if (documentNumberValue && isTransactionExists(documentNumberValue)) {
          console.log(`Пропущена существующая транзакция: ${documentNumberValue}`)
          duplicateCount.count++
          return
        }
        
        seenTransactions.add(transactionKey)

        const transactionData: any = {
          accountId: account.id,
          amount: Math.abs(amount),
          type,
          date: new Date(date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).toISOString().split('T')[0],
          comment: purposeText,
          categoryId: category?.id || '',
          counterpartyId: counterparty?.id || '',
          currency: account.currency,
          accountIIK: accountIIK, // Добавляем ИИК счета
          documentNumber: documentNumberValue, // Добавляем номер документа
        }
        
        // ✅ Для переводов добавляем счет получателя
        if (type === 'transfer' && toAccount) {
          transactionData.toAccountId = toAccount.id
          console.log(`✅ Создана транзакция ПЕРЕВОД: ${account.name} → ${toAccount.name}, сумма: ${amount}`)
        } else {
          console.log(`❌ Создана транзакция ${type.toUpperCase()}: ${account.name}, сумма: ${amount}`)
          console.log(`❌ ОЖИДАЛОСЬ: TRANSFER, ПОЛУЧИЛОСЬ: ${type.toUpperCase()}`)
        }
        
        results.push(transactionData)
      } catch (error) {
        console.error('Error parsing 1C block:', error)
      }
    })
    
    console.log(`Обработано ${results.length} транзакций, пропущено ${duplicateCount.count} дубликатов`)
    return { transactions: results, duplicateCount: duplicateCount.count, totals }
  }

  const handleImport = async () => {
    if (!file) return
    setStatus('processing')
    setMessage('Обработка файла...')
    try {
      let txs: any[] = []
      let duplicateCount = 0
      const ext = file.name.split('.').pop()?.toLowerCase()
      let declaredTotals: { received: number; spent: number; present: boolean } | undefined
      if (ext === 'txt') {
        const text = await file.text()
        // если это 1CClientBankExchange — парсим напрямую
        if (/1CClientBankExchange/i.test(text) || /СекцияДокумент=/i.test(text)) {
          const result = parse1CClientBankExchangeTxt(text)
          txs = result.transactions
          duplicateCount = result.duplicateCount
          declaredTotals = result.totals
        }
      } 
      if (txs.length === 0) {
        // fallback: CSV/XLSX
        let rows: any[] = []
        if (ext === 'csv') {
          const text = await file.text()
          rows = Papa.parse(text, { header: true }).data as any[]
        } else {
          const buf = await file.arrayBuffer()
          const wb = XLSX.read(buf, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(ws)
        }
        txs = process(rows)
      }
      // Контрольные суммы: считаем по транзакциям
      const sumIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0)
      const sumExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0)

      // Если в выписке были указаны суммы ВсегоПоступило/ВсегоСписано — валидируем
      if (declaredTotals?.present) {
        const round2 = (n: number) => Math.round(n * 100) / 100
        const recOk = Math.abs(round2(sumIncome) - round2(declaredTotals.received)) < 0.01
        const expOk = Math.abs(round2(sumExpense) - round2(declaredTotals.spent)) < 0.01
        if (!recOk || !expOk) {
          const msg = `Несоответствие контрольных сумм выписки.\n` +
            `ВсегоПоступило: заявлено ${round2(declaredTotals.received)}, по операциям ${round2(sumIncome)}\n` +
            `ВсегоСписано: заявлено ${round2(declaredTotals.spent)}, по операциям ${round2(sumExpense)}`
          throw new Error(msg)
        }
      }

      // Собираем информацию об ИИК, счетах и дубликатах
      const accountIIKs = new Set<string>()
      const detectedAccounts = new Set<string>()
      const skippedTransactions = new Set<string>()
      const duplicateTransactions = new Set<string>()
      
      txs.forEach((tx) => {
        if (tx.accountIIK && tx.accountIIK.trim() !== '') {
          accountIIKs.add(tx.accountIIK)
        }
        if (tx.accountId) {
          const account = accounts.find(a => a.id === tx.accountId)
          if (account) {
            detectedAccounts.add(account.name)
            addTransaction(tx)
          } else {
            skippedTransactions.add(tx.accountIIK || 'неизвестный ИИК')
          }
        } else {
          // Если нет accountId, значит транзакция была пропущена из-за отсутствия счета
          skippedTransactions.add(tx.accountIIK || 'неизвестный ИИК')
        }
      })
      
      setStatus('success')
      
      // Формируем сообщение об успешном импорте
      let successMessage = `Импортировано ${txs.length} операций`
      successMessage += `\nВсегоПоступило (расчет): ${sumIncome.toFixed(2)}  |  ВсегоСписано (расчет): ${sumExpense.toFixed(2)}`
      if (declaredTotals?.present) {
        successMessage += `\nВсегоПоступило (выписка): ${declaredTotals.received.toFixed(2)}  |  ВсегоСписано (выписка): ${declaredTotals.spent.toFixed(2)}`
      }
      
      if (detectedAccounts.size > 0) {
        successMessage += `\n\nАвтоматически определены счета: ${Array.from(detectedAccounts).join(', ')}`
      }
      
      if (accountIIKs.size > 0) {
        successMessage += `\n\nИИК выписки: ${Array.from(accountIIKs).join(', ')}`
      }
      
          if (skippedTransactions.size > 0) {
            successMessage += `\n\n⚠️ Пропущено операций (счет не найден): ${skippedTransactions.size}`
          }
          
          if (duplicateTransactions.size > 0) {
            successMessage += `\n\n⚠️ Пропущено дубликатов: ${duplicateTransactions.size}`
          }
      
      if (duplicateCount > 0) {
        successMessage += `\n\n🔄 Пропущено дубликатов: ${duplicateCount}`
      }
      
      setMessage(successMessage)
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
            <Label htmlFor="statement-file">Файл выписки</Label>
            <Input id="statement-file" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFileSelect} className="mt-2" />
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


