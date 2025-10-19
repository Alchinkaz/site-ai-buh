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

// Функция для сокращения текста
const truncateText = (text: string, maxLength: number = 30) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function TransactionList() {
  const { transactions, accounts, categories, counterparties, deleteTransaction, updateTransaction } = useFinance()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [limit, setLimit] = useState<number>(50)
  const [currentPage, setCurrentPage] = useState<number>(1)
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
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedTransactionDetails, setSelectedTransactionDetails] = useState<any>(null)

  const allFilteredTransactions = useMemo(() => {
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

  const totalPages = Math.ceil(allFilteredTransactions.length / limit)
  const startIndex = (currentPage - 1) * limit
  const endIndex = startIndex + limit
  const filteredTransactions = allFilteredTransactions.slice(startIndex, endIndex)

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

  const handleShowDetails = (transaction: any) => {
    setSelectedTransactionDetails(transaction)
    setDetailsOpen(true)
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedTransactions(new Set()) // Очищаем выбор при смене страницы
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setCurrentPage(1) // Сбрасываем на первую страницу при изменении лимита
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

    // Проверяем, что функция updateTransaction существует
    if (typeof updateTransaction !== 'function') {
      console.error('updateTransaction function is not available')
      toast({
        title: "Ошибка",
        description: "Функция обновления недоступна",
        variant: "destructive",
      })
      return
    }

    try {
      let updatedCount = 0
      selectedTransactions.forEach(id => {
        // Проверяем, что транзакция существует
        const transaction = transactions.find(t => t.id === id)
        if (!transaction) {
          console.warn(`Transaction with id ${id} not found`)
          return
        }

        const updates: any = {}
        if (bulkEditData.accountId) updates.accountId = bulkEditData.accountId
        if (bulkEditData.categoryId) updates.categoryId = bulkEditData.categoryId
        if (bulkEditData.date) updates.date = bulkEditData.date
        if (bulkEditData.type) updates.type = bulkEditData.type
        if (bulkEditData.counterpartyId) updates.counterpartyId = bulkEditData.counterpartyId
        
        if (Object.keys(updates).length > 0) {
          try {
            updateTransaction(id, updates)
            updatedCount++
          } catch (error) {
            console.error(`Error updating transaction ${id}:`, error)
          }
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
      
      if (updatedCount > 0) {
        toast({
          title: "Успешно",
          description: `Обновлено ${updatedCount} транзакций`,
        })
      } else {
        toast({
          title: "Предупреждение",
          description: "Не было обновлено ни одной транзакции",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in bulk edit:", error)
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
              Показано: {filteredTransactions.length} из {allFilteredTransactions.length} (страница {currentPage} из {totalPages})
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
            <Select value={limit.toString()} onValueChange={(value) => handleLimitChange(Number(value))}>
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
              onClick={() => handleSelectAll(true)}
              className="h-8"
              disabled={selectedTransactions.size === filteredTransactions.length}
            >
              Выбрать все на странице
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTransactions(new Set(allFilteredTransactions.map(t => t.id)))
              }}
              className="h-8"
              disabled={selectedTransactions.size === allFilteredTransactions.length}
            >
              Выбрать все ({allFilteredTransactions.length})
            </Button>
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
          <div className="overflow-y-auto max-h-[600px] overflow-x-hidden">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[90px]">Дата</TableHead>
                  <TableHead className="w-[80px]">Тип</TableHead>
                  <TableHead className="w-[120px]">Категория</TableHead>
                  <TableHead className="w-[140px]">Счёт</TableHead>
                  <TableHead className="w-[120px]">Контрагент</TableHead>
                  <TableHead className="w-[100px] text-right">Сумма</TableHead>
                  <TableHead className="w-[150px]">Комментарий</TableHead>
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
                    <TableRow 
                      key={transaction.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleEdit(transaction)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs">{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium text-xs px-1 py-0", getTypeColor(transaction.type))}>
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category && transaction.type !== "transfer" ? (
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                            <span className="text-xs" title={category.name}>{truncateText(category.name, 15)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.type === "transfer" && toAccount ? (
                          <div className="text-xs">
                            <div className="font-medium" title={account?.name}>{truncateText(account?.name || "-", 12)}</div>
                            <div className="text-center text-muted-foreground">→</div>
                            <div className="font-medium" title={toAccount.name}>{truncateText(toAccount.name, 12)}</div>
                          </div>
                        ) : (
                          <span className="text-xs" title={account?.name}>{truncateText(account?.name || "-", 15)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <span title={counterparty?.name}>{truncateText(counterparty?.name || "-", 15)}</span>
                      </TableCell>
                      <TableCell
                        className={cn("text-right font-semibold tabular-nums text-xs", {
                          "text-green-600 dark:text-green-400": transaction.type === "income",
                          "text-red-600 dark:text-red-400": transaction.type === "expense",
                          "text-blue-600 dark:text-blue-400": transaction.type === "transfer",
                        })}
                      >
                        {transaction.type === "expense" && "-"}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span title={transaction.comment}>{truncateText(transaction.comment || "-", 20)}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Вперед
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Страница {currentPage} из {totalPages}
            </div>
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

    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Подробности транзакции</DialogTitle>
        </DialogHeader>
        {selectedTransactionDetails && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Дата</label>
              <p className="text-sm">{formatDate(selectedTransactionDetails.date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Тип</label>
              <p className="text-sm">{getTypeLabel(selectedTransactionDetails.type)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Сумма</label>
              <p className="text-sm font-semibold">
                {selectedTransactionDetails.type === "expense" && "-"}
                {formatCurrency(selectedTransactionDetails.amount, selectedTransactionDetails.currency)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Счёт</label>
              <p className="text-sm">{accounts.find(a => a.id === selectedTransactionDetails.accountId)?.name || "-"}</p>
            </div>
            {selectedTransactionDetails.toAccountId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Получатель</label>
                <p className="text-sm">{accounts.find(a => a.id === selectedTransactionDetails.toAccountId)?.name || "-"}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Категория</label>
              <p className="text-sm">{categories.find(c => c.id === selectedTransactionDetails.categoryId)?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Контрагент</label>
              <p className="text-sm">{counterparties.find(cp => cp.id === selectedTransactionDetails.counterpartyId)?.name || "-"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Комментарий</label>
              <p className="text-sm whitespace-pre-wrap">{selectedTransactionDetails.comment || "-"}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Закрыть
              </Button>
            </div>
          </div>
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


