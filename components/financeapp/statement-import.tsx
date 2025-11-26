"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle, Wallet } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { useFinance } from "@/lib/financeapp/finance-context"
import type { Category } from "@/lib/financeapp/types"
import { AccountForm } from "@/components/financeapp/account-form"

export function StatementImport() {
  const { accounts, categories, counterparties, transactions, addTransaction, addAccount, addCategory, addCounterparty } = useFinance()

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  // Ref для отслеживания созданных счетов в рамках одной сессии парсинга
  const createdAccountsRef = useRef<Set<string>>(new Set())
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  // Состояние для диалога добавления счета
  const [missingAccountDialog, setMissingAccountDialog] = useState<{
    open: boolean
    accountIIK: string
    bankName: string
    accountType: "bank" | "cash" | "kaspi" | "other"
  }>({
    open: false,
    accountIIK: "",
    bankName: "",
    accountType: "bank"
  })
  const [accountFormOpen, setAccountFormOpen] = useState(false)

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

  // Функция для определения банка по ИИК
  function detectBankByIIK(iik: string): { bankName: string, accountType: "bank" | "kaspi" | "cash" | "other" } {
    if (!iik) return { bankName: "Неизвестный банк", accountType: "other" }
    
    const iikClean = iik.replace(/\s+/g, '').toUpperCase()
    
    // Определение банка по префиксу ИИК
    if (iikClean.startsWith('KZ877')) return { bankName: "Kaspi Bank", accountType: "bank" }
    if (iikClean.startsWith('KZ887')) return { bankName: "Kaspi Pay", accountType: "kaspi" }
    if (iikClean.startsWith('KZ949') || iikClean.startsWith('KZ209') || iikClean.startsWith('KZ119')) return { bankName: "Forte Bank", accountType: "bank" }
    if (iikClean.startsWith('KZ086')) return { bankName: "Halyk Bank", accountType: "bank" }
    if (iikClean === 'CASH') return { bankName: "Cash Desk", accountType: "cash" }
    
    return { bankName: "Неизвестный банк", accountType: "other" }
  }

  // Функция для поиска счета по ИИК (возвращает объект счета)
  // Автоматически создает счет, если его нет
  // processedIIKs - кэш обработанных ИИК для избежания дубликатов
  function findAccountByIIK(accountIIK: string, autoCreate: boolean = true, processedIIKs?: Set<string>): any | null {
    if (!accountIIK || accountIIK.trim() === '') return null
    
    const iikTrimmed = accountIIK.trim()
    const iikNormalized = iikTrimmed.replace(/\s+/g, '').toUpperCase()
    
    // Проверяем ref - если счет уже был создан в этой сессии, не создаем повторно
    if (createdAccountsRef.current.has(iikNormalized)) {
      // Ищем счет в текущем списке (он должен быть уже создан)
      const cachedAccount = accounts.find(account => {
        if (!account.accountNumber) return false
        const normalized = account.accountNumber.replace(/\s+/g, '').toUpperCase()
        return normalized === iikNormalized
      })
      if (cachedAccount) {
        return cachedAccount
      }
    }
    
    // Проверяем кэш обработанных ИИК
    if (processedIIKs && processedIIKs.has(iikNormalized)) {
      // ИИК уже обрабатывался, ищем счет в текущем списке
      const cachedAccount = accounts.find(account => {
        if (!account.accountNumber) return false
        const normalized = account.accountNumber.replace(/\s+/g, '').toUpperCase()
        return normalized === iikNormalized
      })
      if (cachedAccount) {
        return cachedAccount
      }
    }
    
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
    
    // Если счет найден, добавляем в кэш и возвращаем
    if (matchingAccount) {
      if (processedIIKs) {
        processedIIKs.add(iikNormalized)
      }
      return matchingAccount
    }
    
    // Если счет не найден и включено автсоздание - создаем новый счет
    if (autoCreate && iikTrimmed.toUpperCase() !== 'CASH') {
      // Проверяем кэш - если уже обрабатывали этот ИИК, не создаем повторно
      if (processedIIKs && processedIIKs.has(iikNormalized)) {
        // Уже обрабатывали, но счет не найден - возможно еще не успел добавиться
        // Ищем еще раз (возможно, счет был добавлен между вызовами)
        const retryAccount = accounts.find(account => {
          if (!account.accountNumber) return false
          const normalized = account.accountNumber.replace(/\s+/g, '').toUpperCase()
          return normalized === iikNormalized
        })
        if (retryAccount) {
          return retryAccount
        }
        // Если все еще не найден - возвращаем null (не создаем дубликат)
        // Кэш уже содержит этот ИИК, значит мы уже пытались его создать
        return null
      }
      
      // Дополнительная проверка: убеждаемся, что счет действительно не существует
      // (на случай, если он был добавлен между проверками)
      const doubleCheck = accounts.find(account => {
        if (!account.accountNumber) return false
        const normalized = account.accountNumber.replace(/\s+/g, '').toUpperCase()
        return normalized === iikNormalized
      })
      
      if (doubleCheck) {
        // Счет уже существует, добавляем в кэш и возвращаем
        if (processedIIKs) {
          processedIIKs.add(iikNormalized)
        }
        return doubleCheck
      }
      
      // НЕ добавляем в кэш ПЕРЕД созданием - только после успешного создания
      // Это позволит повторно попытаться найти счет, если он был создан в другом месте
      
      const { bankName, accountType } = detectBankByIIK(iikTrimmed)
      
      // Создаем новый счет
      const newAccount = {
        name: `${bankName} (${iikTrimmed.slice(-4)})`, // Последние 4 цифры для краткости
        type: accountType,
        balance: 0,
        currency: "KZT",
        accountNumber: iikTrimmed,
      }
      
      try {
        console.log(`📝 Автоматически создан счет: ${newAccount.name} (${iikTrimmed})`)
        const createdAccount = addAccount(newAccount)
        
        // Добавляем в ref и кэш только после успешного создания
        createdAccountsRef.current.add(iikNormalized)
        if (processedIIKs) {
          processedIIKs.add(iikNormalized)
        }
        
        // Возвращаем созданный счет
        return createdAccount
      } catch (error: any) {
        // Если счет уже существует (ошибка уникальности), ищем его
        console.warn(`⚠️ ${error.message}, ищем существующий счет...`)
        
        // Ищем счет еще раз (возможно, он был добавлен между проверками)
        const existingAccount = accounts.find(account => {
          if (!account.accountNumber) return false
          const normalized = account.accountNumber.replace(/\s+/g, '').toUpperCase()
          return normalized === iikNormalized
        })
        
        if (existingAccount) {
          // Добавляем в ref и кэш найденный счет
          createdAccountsRef.current.add(iikNormalized)
          if (processedIIKs) {
            processedIIKs.add(iikNormalized)
          }
          return existingAccount
        }
        
        // Если не нашли - добавляем в ref и кэш, чтобы не пытаться создавать снова
        // (возможно, счет не может быть создан по какой-то причине)
        createdAccountsRef.current.add(iikNormalized)
        if (processedIIKs) {
          processedIIKs.add(iikNormalized)
        }
        
        return null
      }
    }
    
    return null
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
    const results: any[] = []
    const seenTransactions = new Set<string>() // Для отслеживания дубликатов
    const duplicateCount = { count: 0 } // Счетчик дубликатов
    const processedIIKs = new Set<string>() // Кэш обработанных ИИК для избежания дубликатов счетов
    
    // Очищаем ref при начале новой сессии парсинга
    createdAccountsRef.current.clear()
    
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
        
        // 1. РАСЧСЧЕТ - определяем какой счет наш
        // Для Форте банка используем РасчСчет, если он есть
        // Пробуем разные варианты названия поля
        const raschSchetMatch = block.match(/(?:РасчСчет|РасчетныйСчет|РасчСч|РасчетныйСч)\s*=\s*(.+)/i)
        const raschSchetValue = raschSchetMatch?.[1]?.trim() || ''
        
        let payerIIKValue = ''
        let receiverIIKValue = ''
        
        // Стандартная логика для всех банков
        const payerIIK = block.match(/ПлательщикИИК=(.+)/i)
        const receiverIIK = block.match(/ПолучательИИК=(.+)/i)
        payerIIKValue = payerIIK?.[1]?.trim() || ''
        receiverIIKValue = receiverIIK?.[1]?.trim() || ''
        
        // Если есть РасчСчет, используем его как наш счет (для Форте банка)
        if (raschSchetValue) {
          console.log(`🏦 Форте банк: РасчСчет="${raschSchetValue}"`)
          // РасчСчет - это наш счет, используем его вместо ПлательщикИИК для определения типа транзакции
          payerIIKValue = raschSchetValue
        }
        
        // Проверяем, какие номера счетов принадлежат нашим счетам
        // Если есть РасчСчет, то это наш счет (для Форте банка)
        // Также проверяем по префиксу KZ949 (Forte Bank)
        const payerIIKNormalized = payerIIKValue.replace(/\s+/g, '').toUpperCase()
        const receiverIIKNormalized = receiverIIKValue.replace(/\s+/g, '').toUpperCase()
        
        const isPayerOurAccount = raschSchetValue ? true : (
          payerIIKNormalized.startsWith('KZ949') || // Форте банк по префиксу
          accounts.some(acc => {
            if (!acc.accountNumber) return false
            const accountNumber = acc.accountNumber.replace(/\s+/g, '').toUpperCase()
            return accountNumber === payerIIKNormalized
          })
        )
        
        const isReceiverOurAccount = (
          receiverIIKNormalized.startsWith('KZ949') || // Форте банк по префиксу
          accounts.some(acc => {
            if (!acc.accountNumber) return false
            const accountNumber = acc.accountNumber.replace(/\s+/g, '').toUpperCase()
            return accountNumber === receiverIIKNormalized
          })
        )
        
        console.log(`🔍 Анализ счетов:`)
        if (raschSchetValue) {
          console.log(`  РасчСчет: "${raschSchetValue}" (наш: ${isPayerOurAccount})`)
        } else {
          console.log(`  Плательщик ИИК: "${payerIIKValue}" (наш: ${isPayerOurAccount})`)
        }
        console.log(`  Получатель ИИК: "${receiverIIKValue}" (наш: ${isReceiverOurAccount})`)
        
        // 2. НомерДокумента - для проверки дубликатов
        const documentNumber = block.match(/НомерДокумента=(.+)/i)
        const documentNumberValue = documentNumber?.[1]?.trim() || ''
        
        // 3. ДатаОперации
        let dateMatch = block.match(/ДатаОперации=(.+)/i)
        if (!dateMatch) {
          dateMatch = block.match(/ДатаДокумента=(.+)/i)
        }
        const date = dateMatch?.[1]?.trim() || ''
        
        // Проверяем дубликаты по номеру документа + дате
        if (documentNumberValue && date) {
          const duplicateKey = `${documentNumberValue}_${date}`
          if (seenTransactions.has(duplicateKey)) {
            console.log(`⚠️ Пропущен дубликат: ${documentNumberValue} - ${date}`)
            duplicateCount.count++
            return
          }
          
          // Проверяем существующие транзакции в базе данных
          if (isTransactionExists(documentNumberValue)) {
            console.log(`⚠️ Пропущена существующая транзакция: ${documentNumberValue}`)
            duplicateCount.count++
            return
          }
          
          seenTransactions.add(duplicateKey)
        }
        
        // 4. ПолучательИИК и ПлательщикИИК - определяем тип операции
        let type: 'income' | 'expense' | 'transfer' | undefined
        let amount = 0
        
        // Получаем сумму
        const incomeMatch = block.match(/СуммаПриход=(.+)/i)
        const expenseMatch = block.match(/СуммаРасход=(.+)/i)
        const incomeAlt = block.match(/СуммаДоход=(.+)/i)
        const sumMatch = block.match(/Сумма=(.+)/i)
        
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
            amount = parseFloat(raw)
            
            // Определяем тип по ИИК
            if (isPayerOurAccount && isReceiverOurAccount) {
              type = 'transfer'
              console.log('✅ Тип: TRANSFER (перевод между своими счетами)')
            } else if (isPayerOurAccount) {
              type = 'expense'
              console.log('✅ Тип: EXPENSE (расход с нашего счета)')
            } else if (isReceiverOurAccount) {
              type = 'income'
              console.log('✅ Тип: INCOME (доход на наш счет)')
            } else {
              console.log('⚠️ Неизвестный тип: ни один ИИК не совпадает с нашими счетами')
              return
            }
          } else {
            return // пропускаем если не число
          }
        }
        
        if (!type || !date || !amount) {
          console.log('⚠️ Пропущен блок: отсутствуют обязательные поля')
          return
        }
        
        // 5. ПолучательНаименование или ПлательщикНаименование - определяем контрагента
        const payer = block.match(/ПлательщикНаименование=(.+)/i)
        const receiver = block.match(/ПолучательНаименование=(.+)/i)
        
        const payerName = payer?.[1]?.trim() || ''
        const receiverName = receiver?.[1]?.trim() || ''
        
        let counterpartyName = ''
        let accountIIK = ''
        let toAccountIIK = ''
        
        if (type === 'transfer') {
          // Для переводов: контрагент - это название перевода
          counterpartyName = `Перевод между счетами`
          accountIIK = raschSchetValue || payerIIKValue // Счет откуда (для Форте используем РасчСчет)
          toAccountIIK = receiverIIKValue // Счет куда
          console.log(`🔄 ПЕРЕВОД: ${accountIIK} → ${toAccountIIK}`)
        } else if (type === 'income') {
          // Для доходов: контрагент - плательщик, счет - получатель (наш счет)
          counterpartyName = payerName
          // Для Форте банка используем РасчСчет, если он есть, иначе ПолучательИИК
          accountIIK = raschSchetValue || receiverIIKValue
          console.log(`💰 ДОХОД: контрагент "${counterpartyName}", счет ${accountIIK} (РасчСчет: ${raschSchetValue || 'нет'}, ПолучательИИК: ${receiverIIKValue || 'нет'})`)
        } else if (type === 'expense') {
          // Для расходов: контрагент - получатель, счет - плательщик (наш счет)
          counterpartyName = receiverName
          // Для Форте банка используем РасчСчет, если он есть, иначе ПлательщикИИК
          accountIIK = raschSchetValue || payerIIKValue
          console.log(`💸 РАСХОД: контрагент "${counterpartyName}", счет ${accountIIK} (РасчСчет: ${raschSchetValue || 'нет'}, ПлательщикИИК: ${payerIIKValue || 'нет'})`)
        }
        
        // Исключаем записи без контрагента
        if (!counterpartyName || counterpartyName.trim() === '' || counterpartyName === '-') {
          console.log('⚠️ Пропущен блок: отсутствует контрагент')
          return
        }
        
        // 6. НазначениеПлатежа = Комментарии
        const purpose = block.match(/НазначениеПлатежа=(.+)/i)
        const purposeText = purpose?.[1]?.trim() || ''
        
        // Определяем счет по ИИК (без автсоздания - показываем диалог при отсутствии)
        const account = findAccountByIIK(accountIIK, false, processedIIKs)
        if (!account) {
          console.warn(`⚠️ Не удалось создать или найти счет для ИИК: ${accountIIK}`)
          // Показываем диалог с предложением добавить счет
          const { bankName, accountType } = detectBankByIIK(accountIIK)
          setMissingAccountDialog({
            open: true,
            accountIIK: accountIIK,
            bankName: bankName,
            accountType: accountType
          })
          return
        }
        
        // Для переводов также определяем счет получателя (без автсоздания - показываем диалог при отсутствии)
        let toAccount = null
        if (type === 'transfer') {
          toAccount = findAccountByIIK(toAccountIIK, false, processedIIKs)
          if (!toAccount) {
            console.warn(`⚠️ Не удалось создать или найти счет получателя для ИИК: ${toAccountIIK}`)
            // Показываем диалог с предложением добавить счет получателя
            const { bankName, accountType } = detectBankByIIK(toAccountIIK)
            setMissingAccountDialog({
              open: true,
              accountIIK: toAccountIIK,
              bankName: bankName,
              accountType: accountType
            })
            return
          }
        }
        
        // Определяем категорию
        let categoryName = detectCategoryByText(purposeText)
        
        // Для переводов используем специальную категорию
        if (type === 'transfer') {
          categoryName = 'Перевод между счетами'
        }
        
        let category: Category | undefined = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
        if (!category) {
          category = addCategory({ 
            name: categoryName, 
            type: type,
            color: type === 'income' ? '#10B981' : type === 'transfer' ? '#3B82F6' : '#EF4444' 
          }) as Category
          console.log(`📁 Создана категория: "${categoryName}"`)
        }
        
        // Создаем контрагента если нужно
        let counterparty = counterparties.find((cp) => cp.name.toLowerCase() === counterpartyName.toLowerCase())
        if (!counterparty && counterpartyName) {
          counterparty = addCounterparty({ 
            name: counterpartyName, 
            type: 'supplier'
          })
          console.log(`👤 Создан контрагент: "${counterpartyName}"`)
        }
        
        const transactionData: any = {
          accountId: account.id,
          amount: Math.abs(amount),
          type,
          date: new Date(date.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1')).toISOString().split('T')[0],
          comment: purposeText,
          categoryId: category?.id || '',
          counterpartyId: counterparty?.id || '',
          currency: account.currency,
          accountIIK: accountIIK,
          documentNumber: documentNumberValue,
        }
        
        // Для переводов добавляем счет получателя
        if (type === 'transfer' && toAccount) {
          transactionData.toAccountId = toAccount.id
          console.log(`✅ Создана транзакция ПЕРЕВОД: ${account.name} → ${toAccount.name}, сумма: ${amount}`)
        } else {
          console.log(`✅ Создана транзакция ${type.toUpperCase()}: ${account.name}, сумма: ${amount}`)
        }
        
        results.push(transactionData)
      } catch (error) {
        console.error('Error parsing 1C block:', error)
      }
    })
    
    console.log(`✅ Обработано ${results.length} транзакций, пропущено ${duplicateCount.count} дубликатов`)
    return { transactions: results, duplicateCount: duplicateCount.count }
  }

  const handleImport = async () => {
    if (!file) return
    setStatus('processing')
    setMessage('Обработка файла...')
    try {
      let txs: any[] = []
      let duplicateCount = 0
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'txt') {
        const text = await file.text()
        // если это 1CClientBankExchange — парсим напрямую
        if (/1CClientBankExchange/i.test(text) || /СекцияДокумент=/i.test(text)) {
          const result = parse1CClientBankExchangeTxt(text)
          txs = result.transactions
          duplicateCount = result.duplicateCount
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
    <>
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
    {/* Диалог с предложением добавить счет */}
    <Dialog open={missingAccountDialog.open} onOpenChange={(open) => setMissingAccountDialog({ ...missingAccountDialog, open })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Счет не найден
          </DialogTitle>
          <DialogDescription>
            Для продолжения импорта необходимо добавить счет в систему.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="mt-2 space-y-1">
                <p><strong>Номер счета (ИИК):</strong> {missingAccountDialog.accountIIK}</p>
                <p><strong>Банк:</strong> {missingAccountDialog.bankName}</p>
                <p><strong>Тип:</strong> {missingAccountDialog.accountType === "bank" ? "Банковский счет" : missingAccountDialog.accountType === "kaspi" ? "Kaspi" : missingAccountDialog.accountType === "cash" ? "Наличные" : "Другое"}</p>
              </div>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setMissingAccountDialog({ ...missingAccountDialog, open: false })
                setAccountFormOpen(true)
              }}
              className="flex-1"
            >
              Добавить счет
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setMissingAccountDialog({ ...missingAccountDialog, open: false })}
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {/* Диалог с формой добавления счета */}
    <Dialog open={accountFormOpen} onOpenChange={setAccountFormOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавить новый счет</DialogTitle>
          <DialogDescription>
            Заполните данные для создания счета. Некоторые поля уже заполнены на основе данных из выписки.
          </DialogDescription>
        </DialogHeader>
        <AccountForm
          initialValues={{
            name: `${missingAccountDialog.bankName}${missingAccountDialog.accountIIK ? ` (${missingAccountDialog.accountIIK.slice(-4)})` : ''}`,
            type: missingAccountDialog.accountType,
            accountNumber: missingAccountDialog.accountIIK,
            balance: 0,
            currency: "KZT"
          }}
          onSuccess={() => {
            setAccountFormOpen(false)
            setMissingAccountDialog({ ...missingAccountDialog, open: false })
            // После добавления счета пользователь может перезапустить импорт вручную
            // или мы можем автоматически продолжить парсинг, если файл еще открыт
          }}
          onCancel={() => {
            setAccountFormOpen(false)
            setMissingAccountDialog({ ...missingAccountDialog, open: false })
          }}
        />
      </DialogContent>
    </Dialog>
    </>
  )
}


