"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Wallet, PlusCircle, Trash2, Building2, CreditCard, Banknote } from "lucide-react"
import { FinanceProvider, useFinance } from "@/lib/financeapp/finance-context"
import { AccountForm } from "@/components/financeapp/account-form"
import { formatCurrency, maskAccountNumber } from "@/lib/financeapp/finance-utils"
import { toast } from "sonner"
import Link from "next/link"

function AccountsInner() {
  const { accounts, transactions, deleteAccount } = useFinance()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const getTransactionCount = (accountId: string) =>
    transactions.filter((t) => t.accountId === accountId || t.toAccountId === accountId).length

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(accountId)
      } else {
        newSet.delete(accountId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAccounts(new Set(accounts.map(a => a.id)))
    } else {
      setSelectedAccounts(new Set())
    }
  }

  const handleDeleteSelected = () => {
    if (selectedAccounts.size === 0) {
      toast.error("Выберите счета для удаления")
      return
    }

    // Проверяем, есть ли транзакции у выбранных счетов
    const accountsWithTransactions = accounts.filter(acc => {
      if (!selectedAccounts.has(acc.id)) return false
      const count = getTransactionCount(acc.id)
      return count > 0
    })

    if (accountsWithTransactions.length > 0) {
      toast.error(`Нельзя удалить счета с транзакциями: ${accountsWithTransactions.map(a => a.name).join(", ")}`)
      return
    }

    const count = selectedAccounts.size
    if (confirm(`Вы уверены, что хотите удалить ${count} счетов?`)) {
      try {
        selectedAccounts.forEach(id => deleteAccount(id))
        setSelectedAccounts(new Set())
        toast.success(`Удалено ${count} счетов`)
      } catch (error) {
        console.error("Error deleting accounts:", error)
        toast.error("Не удалось удалить счета")
      }
    }
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Building2 className="h-4 w-4" />
      case "kaspi":
        return <CreditCard className="h-4 w-4" />
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "cash":
        return <Banknote className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "bank":
        return "Банк"
      case "kaspi":
        return "Kaspi"
      case "cash":
        return "Наличные"
      case "card":
        return "Карта"
      case "other":
        return "Другое"
      default:
        return type
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Счета и кошельки</h1>
          <p className="mt-1 text-muted-foreground">Управление счетами и балансами</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добавить счёт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создать новый счёт</DialogTitle>
              <DialogDescription>
                Добавьте банковский счёт, кошелёк или наличные для отслеживания финансов
              </DialogDescription>
            </DialogHeader>
            <AccountForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Общий баланс
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Сумма по всем счетам</p>
        </CardContent>
      </Card>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Нет счетов</h3>
          <p className="mb-4 text-sm text-muted-foreground">Создайте первый счёт, чтобы начать отслеживать финансы</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Создать счёт
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать новый счёт</DialogTitle>
                <DialogDescription>
                  Добавьте банковский счёт, кошелёк или наличные для отслеживания финансов
                </DialogDescription>
              </DialogHeader>
              <AccountForm onSuccess={() => setIsDialogOpen(false)} onCancel={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Список счетов ({accounts.length})</CardTitle>
              {selectedAccounts.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить выбранные ({selectedAccounts.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAccounts.size === accounts.length && accounts.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Номер счета</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Баланс</TableHead>
                    <TableHead>Транзакций</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => {
                    const transactionCount = getTransactionCount(account.id)
                    return (
                      <TableRow key={account.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedAccounts.has(account.id)}
                            onCheckedChange={(checked) => handleSelectAccount(account.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="text-primary">{getAccountIcon(account.type)}</div>
                            <span>{account.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.accountNumber ? (
                            <span className="text-sm text-muted-foreground font-mono" title={account.accountNumber}>
                              {maskAccountNumber(account.accountNumber)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getAccountTypeLabel(account.type)}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(account.balance, account.currency)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{transactionCount}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="link" size="sm" asChild className="h-auto p-0">
                            <Link href={`/cash-register/accounts-fa/${account.id}`}>Подробнее →</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function AccountsFA() {
  return (
    <DashboardLayout>
      <FinanceProvider>
        <AccountsInner />
      </FinanceProvider>
    </DashboardLayout>
  )
}


