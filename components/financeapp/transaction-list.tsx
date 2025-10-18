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
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Search, Filter, ArrowRight, Pencil, Edit3, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransactionForm } from "@/components/financeapp/transaction-form"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function TransactionList() {
  const { transactions, accounts, categories, counterparties, deleteTransaction, updateTransaction } = useFinance()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [limit, setLimit] = useState<number>(50)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [editOpen, setEditOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditData, setBulkEditData] = useState({
    accountId: "",
    categoryId: "",
    date: "",
    type: "",
    counterpartyId: ""
  })

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
      .slice(0, limit)
  }, [transactions, accounts, categories, counterparties, searchTerm, filterType, filterCategory, limit])

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

  const handleSelectTransaction = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)))
    } else {
      setSelectedTransactions(new Set())
    }
  }

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return
    
    if (confirm(`Вы уверены, что хотите удалить ${selectedTransactions.size} транзакций? Балансы счетов будут скорректированы.`)) {
      try {
        selectedTransactions.forEach(id => deleteTransaction(id))
        setSelectedTransactions(new Set())
        toast({
          title: "Успешно",
          description: `Удалено ${selectedTransactions.size} транзакций`,
        })
      } catch (error) {
        console.error("Error deleting transactions:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось удалить транзакции",
          variant: "destructive",
        })
      }
    }
  }

  const handleBulkEdit = () => {
    if (selectedTransactions.size === 0) return
    setBulkEditOpen(true)
  }

  const handleBulkEditSubmit = () => {
    if (selectedTransactions.size === 0) return

    try {
      selectedTransactions.forEach(id => {
        const updates: any = {}
        if (bulkEditData.accountId) updates.accountId = bulkEditData.accountId
        if (bulkEditData.categoryId) updates.categoryId = bulkEditData.categoryId
        if (bulkEditData.date) updates.date = bulkEditData.date
        if (bulkEditData.type) updates.type = bulkEditData.type
        if (bulkEditData.counterpartyId) updates.counterpartyId = bulkEditData.counterpartyId
        
        if (Object.keys(updates).length > 0) {
          updateTransaction(id, updates)
        }
      })
      
      setSelectedTransactions(new Set())
      setBulkEditOpen(false)
      setBulkEditData({
        accountId: "",
        categoryId: "",
        date: "",
        type: "",
        counterpartyId: ""
      })
      
      toast({
        title: "Успешно",
        description: `Обновлено ${selectedTransactions.size} транзакций`,
      })
    } catch (error) {
      console.error("Error updating transactions:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить транзакции",
        variant: "destructive",
      })
    }
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
            <p className="mt-1 text-sm text-muted-foreground">
              Показано: {filteredTransactions.length} из {transactions.length}
              {selectedTransactions.size > 0 && ` • Выбрано: ${selectedTransactions.size}`}
            </p>
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
            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
              <SelectTrigger className="md:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedTransactions.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Выбрано: {selectedTransactions.size}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkEdit}
              className="h-8"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Редактировать
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTransactions(new Set())}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              Отменить выбор
            </Button>
          </div>
        )}
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
            <Table className="table-fixed" style={{ wordBreak: 'break-word', tableLayout: 'fixed' }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">Дата</TableHead>
                  <TableHead className="w-[100px]">Тип</TableHead>
                  <TableHead className="w-[150px]">Категория</TableHead>
                  <TableHead className="w-[200px]">Счёт</TableHead>
                  <TableHead className="w-[180px]">Контрагент</TableHead>
                  <TableHead className="w-[120px] text-right">Сумма</TableHead>
                  <TableHead className="w-[200px]">Комментарий</TableHead>
                  <TableHead className="w-[100px]">Действия</TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", getTypeColor(transaction.type))}>
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[150px]">
                        {category && transaction.type !== "transfer" ? (
                          <div className="flex items-start gap-2">
                            <div className="h-2 w-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: category.color }} />
                            <span className="text-sm leading-tight break-words">{category.name}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        {transaction.type === "transfer" && toAccount ? (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium break-words">{account?.name || "-"}</div>
                            <div className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">→</span>
                            </div>
                            <div className="font-medium break-words">{toAccount.name}</div>
                          </div>
                        ) : (
                          <span className="text-sm break-words">{account?.name || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[180px] text-muted-foreground">
                        <span className="text-sm break-words leading-tight">{counterparty?.name || "-"}</span>
                      </TableCell>
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
                      <TableCell className="w-[200px] text-sm text-muted-foreground">
                        <span className="break-words leading-tight">{transaction.comment || "-"}</span>
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

    <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Массовое редактирование</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Редактировать {selectedTransactions.size} транзакций
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Счёт</label>
            <Select value={bulkEditData.accountId} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, accountId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не изменять</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Категория</label>
            <Select value={bulkEditData.categoryId} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, categoryId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не изменять</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Тип</label>
            <Select value={bulkEditData.type} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не изменять</SelectItem>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="expense">Расход</SelectItem>
                <SelectItem value="transfer">Перевод</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Контрагент</label>
            <Select value={bulkEditData.counterpartyId} onValueChange={(value) => setBulkEditData(prev => ({ ...prev, counterpartyId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите контрагента" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Не изменять</SelectItem>
                {counterparties.map((counterparty) => (
                  <SelectItem key={counterparty.id} value={counterparty.id}>
                    {counterparty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Дата</label>
            <Input
              type="date"
              value={bulkEditData.date}
              onChange={(e) => setBulkEditData(prev => ({ ...prev, date: e.target.value }))}
              placeholder="Выберите дату"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleBulkEditSubmit}>
              Применить
            </Button>
          </div>
        </div>
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


