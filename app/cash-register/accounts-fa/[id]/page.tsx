"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useRef, useCallback } from "react"
import { FinanceProvider, useFinance } from "@/lib/financeapp/finance-context"
import { formatCurrency, formatDate, maskAccountNumber } from "@/lib/financeapp/finance-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AccountForm } from "@/components/financeapp/account-form"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

// Форматирование чисел как в Admiral Design System
const numberFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

// Компонент для ячейки суммы с правильным форматированием
const AmountCell = ({ amount, currency, type, isNegative = false, disabled = false }: { 
  amount: number
  currency?: string
  type: string
  isNegative?: boolean
  disabled?: boolean
}) => {
  const formattedAmount = numberFormatter.format(amount)
  
  return (
    <div 
      className={cn(
        "text-right font-semibold tabular-nums text-xs",
        "text-overflow-ellipsis overflow-hidden",
        {
          "text-green-600 dark:text-green-400": type === "income",
          "text-red-600 dark:text-red-400": type === "expense" || isNegative,
          "text-blue-600 dark:text-blue-400": type === "transfer",
          "opacity-50": disabled,
        }
      )}
    >
      {isNegative && "-"}
      {formattedAmount} {currency || "KZT"}
    </div>
  )
}

// Компонент для заголовка столбца с возможностью изменения размера
const ResizableTableHead = ({ 
  children, 
  width, 
  onResize, 
  minWidth = 50,
  className = "",
  ...props 
}: { 
  children: React.ReactNode
  width: number
  onResize: (width: number) => void
  minWidth?: number
  className?: string
  [key: string]: any
}) => {
  const headerRef = useRef<HTMLTableCellElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const diff = e.clientX - startXRef.current
    const newWidth = Math.max(minWidth, startWidthRef.current + diff)
    onResize(newWidth)
  }, [minWidth, onResize])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, handleMouseMove, handleMouseUp])

  return (
    <TableHead
      ref={headerRef}
      className={cn("relative select-none", className)}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-10",
          isResizing && "bg-primary"
        )}
        onMouseDown={handleMouseDown}
        style={{ userSelect: 'none' }}
      />
    </TableHead>
  )
}

function AccountDetailInner() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { accounts, transactions, categories, counterparties, deleteAccount, updateAccount } = useFinance()
  const [editOpen, setEditOpen] = useState(false)
  const [isEditingBalance, setIsEditingBalance] = useState(false)
  const [balanceValue, setBalanceValue] = useState("")
  
  // Состояние для ширины столбцов
  const [columnWidths, setColumnWidths] = useState({
    date: 100,
    type: 80,
    category: 120,
    counterparty: 150,
    amount: 120,
    comment: 200,
  })

  const account = accounts.find((a) => a.id === id)
  const accountTransactions = transactions
    .filter((t) => t.accountId === id || t.toAccountId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (!account) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Счёт не найден</h2>
          <Button asChild className="mt-4">
            <Link href="/cash-register/accounts-fa">Вернуться к счетам</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDeleteAccount = () => {
    if (accountTransactions.length > 0) {
      return
    }
    if (confirm(`Вы уверены, что хотите удалить счёт "${account.name}"?`)) {
      deleteAccount(id)
      router.push("/cash-register/accounts-fa")
    }
  }

  // Calculate income: direct income + transfers TO this account
  const directIncome = accountTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const transferIncome = accountTransactions.filter((t) => t.type === "transfer" && t.toAccountId === id).reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = directIncome + transferIncome

  // Calculate expense: direct expense + transfers FROM this account
  const directExpense = accountTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const transferExpense = accountTransactions.filter((t) => t.type === "transfer" && t.accountId === id).reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = directExpense + transferExpense

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "expense":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "transfer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return ""
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Доход"
      case "expense":
        return "Расход"
      case "transfer":
        return "Перевод"
      default:
        return type
    }
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cash-register/accounts-fa">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="leading-tight">
              <h1 className="text-2xl font-bold">
                <span className="block max-w-[260px] truncate" title={account.name}>{account.name}</span>
              </h1>
              {account.accountNumber && (
                <span className="mt-0.5 block text-xs text-muted-foreground" title={account.accountNumber}>
                  {maskAccountNumber(account.accountNumber)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">История операций по счёту</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={accountTransactions.length > 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Удалить счёт
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Текущий баланс</CardTitle>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {!isEditingBalance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBalanceValue(account.balance.toString())
                    setIsEditingBalance(true)
                  }}
                  className="h-6 px-2"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingBalance ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={balanceValue}
                  onChange={(e) => setBalanceValue(e.target.value)}
                  className="text-2xl font-bold w-auto"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const newBalance = parseFloat(balanceValue) || 0
                    updateAccount(id, { balance: newBalance })
                    setIsEditingBalance(false)
                    toast.success("Баланс обновлен")
                  }}
                >
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditingBalance(false)
                    setBalanceValue("")
                  }}
                >
                  Отмена
                </Button>
              </div>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего поступлений</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome, account.currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Доходы: {formatCurrency(directIncome, account.currency)} • Переводы: {formatCurrency(transferIncome, account.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего расходов</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense, account.currency)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Расходы: {formatCurrency(directExpense, account.currency)} • Переводы: {formatCurrency(transferExpense, account.currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История транзакций</CardTitle>
        </CardHeader>
        <CardContent>
          {accountTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Нет транзакций по этому счёту</div>
          ) : (
            <Table
              containerClassName="overflow-y-auto max-h-[600px] overflow-x-hidden"
              className="w-full table-fixed"
            >
              <TableHeader className="[&_tr]:bg-card [&_tr]:shadow-md [&_tr]:border-b [&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-30 [&_th]:bg-card/95 [&_th]:backdrop-blur [&_th]:h-10 [&_th]:px-2 [&_th]:text-left [&_th]:align-middle [&_th]:font-medium">
                <TableRow className="bg-card hover:bg-card border-b">
                  <ResizableTableHead
                    width={columnWidths.date}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, date: w }))}
                    minWidth={70}
                  >
                    Дата
                  </ResizableTableHead>
                  <ResizableTableHead
                    width={columnWidths.type}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, type: w }))}
                    minWidth={60}
                  >
                    Тип
                  </ResizableTableHead>
                  <ResizableTableHead
                    width={columnWidths.category}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, category: w }))}
                    minWidth={80}
                  >
                    Категория
                  </ResizableTableHead>
                  <ResizableTableHead
                    width={columnWidths.counterparty}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, counterparty: w }))}
                    minWidth={100}
                  >
                    Контрагент
                  </ResizableTableHead>
                  <ResizableTableHead
                    width={columnWidths.amount}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, amount: w }))}
                    minWidth={80}
                    className="text-right"
                  >
                    Сумма
                  </ResizableTableHead>
                  <ResizableTableHead
                    width={columnWidths.comment}
                    onResize={(w) => setColumnWidths(prev => ({ ...prev, comment: w }))}
                    minWidth={100}
                  >
                    Комментарий
                  </ResizableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountTransactions.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId)
                  const counterparty = counterparties.find((cp) => cp.id === transaction.counterpartyId)
                  const isIncome = transaction.type === "income" || (transaction.type === "transfer" && transaction.toAccountId === id)
                  const isExpense = transaction.type === "expense" || (transaction.type === "transfer" && transaction.accountId === id)
                  
                  return (
                    <TableRow key={transaction.id} className="border-b hover:bg-muted/50 transition-colors">
                      <TableCell 
                        className="p-2 align-middle text-xs whitespace-nowrap"
                        style={{ width: `${columnWidths.date}px`, minWidth: `${columnWidths.date}px`, maxWidth: `${columnWidths.date}px` }}
                      >
                        {new Date(transaction.date).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell 
                        className="p-2 align-middle"
                        style={{ width: `${columnWidths.type}px`, minWidth: `${columnWidths.type}px`, maxWidth: `${columnWidths.type}px` }}
                      >
                        <Badge className={cn("font-medium text-xs px-1 py-0", getBadgeTypeClass(transaction.type))}>
                          {getBadgeTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell 
                        className="p-2 align-middle text-xs"
                        style={{ width: `${columnWidths.category}px`, minWidth: `${columnWidths.category}px`, maxWidth: `${columnWidths.category}px` }}
                      >
                        {category?.name || "-"}
                      </TableCell>
                      <TableCell 
                        className="p-2 align-middle text-xs text-muted-foreground"
                        style={{ width: `${columnWidths.counterparty}px`, minWidth: `${columnWidths.counterparty}px`, maxWidth: `${columnWidths.counterparty}px` }}
                      >
                        <span className="whitespace-nowrap">{counterparty?.name || "-"}</span>
                      </TableCell>
                      <TableCell 
                        className="p-2 align-middle text-right"
                        style={{ width: `${columnWidths.amount}px`, minWidth: `${columnWidths.amount}px`, maxWidth: `${columnWidths.amount}px` }}
                      >
                        <AmountCell 
                          amount={transaction.amount} 
                          currency={transaction.currency}
                          type={isIncome ? "income" : isExpense ? "expense" : transaction.type}
                          isNegative={isExpense}
                        />
                      </TableCell>
                      <TableCell 
                        className="p-2 align-middle text-xs text-muted-foreground"
                        style={{ width: `${columnWidths.comment}px`, minWidth: `${columnWidths.comment}px`, maxWidth: `${columnWidths.comment}px` }}
                      >
                        <span className="text-overflow-ellipsis overflow-hidden block" title={transaction.comment}>
                          {transaction.comment || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактировать счёт</DialogTitle>
        </DialogHeader>
        <AccountForm
          accountId={id}
          initialValues={{
            name: account?.name,
            type: account?.type as any,
            balance: account?.balance,
            currency: account?.currency,
            accountNumber: account?.accountNumber,
          }}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </DialogContent>
    </Dialog>
    </>
  )
}

function getBadgeTypeLabel(type: string) {
  switch (type) {
    case "income":
      return "Доход"
    case "expense":
      return "Расход"
    case "transfer":
      return "Перевод"
    default:
      return type
  }
}
function getBadgeTypeClass(type: string) {
  switch (type) {
    case "income":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "expense":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "transfer":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    default:
      return ""
  }
}

export default function AccountDetailPage() {
  return (
    <DashboardLayout>
      <FinanceProvider>
        <AccountDetailInner />
      </FinanceProvider>
    </DashboardLayout>
  )
}


