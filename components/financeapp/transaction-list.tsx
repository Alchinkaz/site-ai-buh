"use client"

import { useState, useMemo } from "react"
import { useFinance } from "@/lib/financeapp/finance-context"
import { formatCurrency, formatDate } from "@/lib/financeapp/finance-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Search, Filter, ArrowRight, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "@/components/financeapp/transaction-form"
import { cn } from "@/lib/utils"
import { useToast } from "sonner"

export function TransactionList() {
  const { transactions, accounts, categories, counterparties, deleteTransaction } = useFinance()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [editOpen, setEditOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterType !== "all" && t.type !== filterType) return false
        if (filterCategory !== "all" && t.categoryId !== filterCategory) return false
        if (searchTerm) {
          const account = accounts.find((a) => a.id === t.accountId)
          const toAccount = t.toAccountId ? accounts.find((a) => a.id === t.toAccountId) : null
          const category = categories.find((c) => c.id === t.categoryId)
          const counterparty = counterparties.find((cp) => cp.id === t.counterpartyId)
          const searchLower = searchTerm.toLowerCase()
          return (
            t.comment?.toLowerCase().includes(searchLower) ||
            account?.name.toLowerCase().includes(searchLower) ||
            toAccount?.name.toLowerCase().includes(searchLower) ||
            category?.name.toLowerCase().includes(searchLower) ||
            counterparty?.name.toLowerCase().includes(searchLower) ||
            t.amount.toString().includes(searchLower)
          )
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, accounts, categories, counterparties, searchTerm, filterType, filterCategory])

  const handleDelete = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить эту транзакцию? Баланс счёта будет скорректирован.")) {
      try {
        deleteTransaction(id)
        toast({
          title: "Успешно",
          description: "Транзакция удалена",
        })
      } catch (error) {
        console.error("Error deleting transaction:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить транзакцию",
          variant: "destructive",
        })
      }
    }
  }

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setEditOpen(true)
  }

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
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Транзакции</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Всего: {filteredTransactions.length}</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 md:w-[200px]"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="md:w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="income">Доходы</SelectItem>
                <SelectItem value="expense">Расходы</SelectItem>
                <SelectItem value="transfer">Переводы</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {transactions.length === 0 ? "Нет транзакций" : "Ничего не найдено"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {transactions.length === 0
                ? "Добавьте первую транзакцию, чтобы начать отслеживать финансы"
                : "Попробуйте изменить фильтры или поисковый запрос"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Счёт</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Комментарий</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.accountId)
                  const toAccount = transaction.toAccountId
                    ? accounts.find((a) => a.id === transaction.toAccountId)
                    : null
                  const category = categories.find((c) => c.id === transaction.categoryId)
                  const counterparty = counterparties.find((cp) => cp.id === transaction.counterpartyId)

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap font-medium">{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getTypeColor(transaction.type))}>
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category && transaction.type !== "transfer" ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.type === "transfer" && toAccount ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-medium">{account?.name || "-"}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{toAccount.name}</span>
                          </div>
                        ) : (
                          account?.name || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{counterparty?.name || "-"}</TableCell>
                      <TableCell
                        className={cn("text-right font-semibold tabular-nums", {
                          "text-green-600 dark:text-green-400": transaction.type === "income",
                          "text-red-600 dark:text-red-400": transaction.type === "expense",
                          "text-blue-600 dark:text-blue-400": transaction.type === "transfer",
                        })}
                      >
                        {transaction.type === "expense" && "-"}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {transaction.comment || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                            className="hover:bg-blue-100"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    <Dialog open={editOpen} onOpenChange={setEditOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать транзакцию</DialogTitle>
        </DialogHeader>
        {editingTransaction && (
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}

function getTypeColor(type: string) {
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

function getTypeLabel(type: string) {
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


