"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wallet, PlusCircle } from "lucide-react"
import { FinanceProvider, useFinance } from "@/lib/financeapp/finance-context"
import { AccountCard } from "@/components/financeapp/account-card"
import { AccountForm } from "@/components/financeapp/account-form"
import { formatCurrency } from "@/lib/financeapp/finance-utils"

function AccountsInner() {
  const { accounts, transactions } = useFinance()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const getTransactionCount = (accountId: string) =>
    transactions.filter((t) => t.accountId === accountId || t.toAccountId === accountId).length

  const rootAccounts = accounts.filter((a) => !a.parentId)
  const childrenOf = (parentId: string) => accounts.filter((a) => a.parentId === parentId)

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
        <div className="space-y-6">
          {rootAccounts.map((account) => {
            const children = childrenOf(account.id)
            const groupBalance = account.balance + children.reduce((s, c) => s + c.balance, 0)
            return (
              <div key={account.id} className="space-y-3">
                <AccountCard account={{ ...account, balance: groupBalance }} transactionCount={getTransactionCount(account.id)} />
                {children.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pl-1">
                    {children.map((child) => (
                      <AccountCard key={child.id} account={child} transactionCount={getTransactionCount(child.id)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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


