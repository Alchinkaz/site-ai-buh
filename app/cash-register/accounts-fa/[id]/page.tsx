"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FinanceProvider, useFinance } from "@/lib/financeapp/finance-context"
import { formatCurrency, formatDate } from "@/lib/financeapp/finance-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"

function AccountDetailInner() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { accounts, transactions, categories, counterparties, deleteAccount } = useFinance()

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

  const totalIncome = accountTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = accountTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cash-register/accounts-fa">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="block max-w-[260px] truncate" title={account.name}>{account.name}</span>
            </h1>
            <p className="text-sm text-muted-foreground">История операций по счёту</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={accountTransactions.length > 0}>
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить счёт
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Текущий баланс</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(account.balance, account.currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего поступлений</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome, account.currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего расходов</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpense, account.currency)}</div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Контрагент</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTransactions.map((transaction) => {
                    const category = categories.find((c) => c.id === transaction.categoryId)
                    const counterparty = counterparties.find((cp) => cp.id === transaction.counterpartyId)
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <Badge className={cn("font-medium", getBadgeTypeClass(transaction.type))}>{getBadgeTypeLabel(transaction.type)}</Badge>
                        </TableCell>
                        <TableCell>{category?.name || "-"}</TableCell>
                        <TableCell>{counterparty?.name || "-"}</TableCell>
                        <TableCell className={cn("text-right font-semibold", { "text-green-600 dark:text-green-400": transaction.type === "income", "text-red-600 dark:text-red-400": transaction.type === "expense" })}>
                          {transaction.type === "expense" && "-"}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{transaction.comment || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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


