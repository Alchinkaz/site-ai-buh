"use client"

import type React from "react"
import { useState } from "react"
import { useFinance } from "@/lib/financeapp/finance-context"
import type { TransactionType } from "@/lib/financeapp/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface TransactionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  transaction?: any
}

export function TransactionForm({ onSuccess, onCancel, transaction }: TransactionFormProps) {
  const { accounts, categories, counterparties, addTransaction, updateTransaction } = useFinance()

  const [date, setDate] = useState(transaction?.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0])
  const [amount, setAmount] = useState(transaction?.amount ? String(transaction.amount) : "")
  const [type, setType] = useState<TransactionType>(transaction?.type || "expense")
  const [accountId, setAccountId] = useState(transaction?.accountId || "")
  const [toAccountId, setToAccountId] = useState(transaction?.toAccountId || "")
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "")
  const [counterpartyId, setCounterpartyId] = useState(transaction?.counterpartyId || "")
  const [comment, setComment] = useState(transaction?.comment || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!accountId) {
      toast.error("Выберите счёт")
      return
    }

    if (type === "transfer") {
      if (!toAccountId) {
        toast.error("Выберите счёт назначения")
        return
      }
      if (accountId === toAccountId) {
        toast.error("Счёт отправителя и получателя должны быть разными")
        return
      }
    }

    if (!categoryId && type !== "transfer") {
      toast.error("Выберите категорию")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (!amount || amountNum <= 0 || Number.isNaN(amountNum)) {
      toast.error("Введите корректную сумму")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        date,
        amount: amountNum,
        currency: "KZT",
        type,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        categoryId: type === "transfer" ? "transfer-category" : categoryId,
        counterpartyId: counterpartyId || undefined,
        comment: comment.trim() || undefined,
      }

      if (transaction) {
        updateTransaction(transaction.id, payload)
        toast.success("Транзакция обновлена")
      } else {
        addTransaction(payload)
        toast.success(type === "transfer" ? "Перевод выполнен" : "Транзакция добавлена")
      }

      if (!transaction) {
        setDate(new Date().toISOString().split("T")[0])
        setAmount("")
        setType("expense")
        setAccountId("")
        setToAccountId("")
        setCategoryId("")
        setCounterpartyId("")
        setComment("")
      }

      onSuccess?.()
    } catch (error) {
      toast.error("Не удалось добавить транзакцию")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Дата *</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full max-w-full" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Сумма *</Label>
          <Input id="amount" type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full max-w-full" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Тип транзакции *</Label>
        <Select value={type} onValueChange={(value) => { setType(value as TransactionType); setCategoryId(""); setToAccountId("") }}>
          <SelectTrigger id="type" className="w-full max-w-full break-words overflow-hidden"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Доход</SelectItem>
            <SelectItem value="expense">Расход</SelectItem>
            <SelectItem value="transfer">Перевод</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "transfer" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">Со счёта *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="fromAccount" className="w-full max-w-full break-words overflow-hidden"><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name} ({account.balance.toLocaleString()} {account.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="toAccount">На счёт *</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger id="toAccount" className="w-full max-w-full break-words overflow-hidden"><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.id !== accountId).map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name} ({account.balance.toLocaleString()} {account.currency})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="account">Счёт *</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="account" className="w-full max-w-full break-words overflow-hidden"><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>{account.name} ({account.balance.toLocaleString()} {account.currency})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type !== "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="category">Категория *</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category" className="w-full max-w-full break-words overflow-hidden"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type !== "transfer" && (
        <div className="space-y-2">
          <Label htmlFor="counterparty">Контрагент (необязательно)</Label>
          <Select value={counterpartyId} onValueChange={setCounterpartyId}>
            <SelectTrigger id="counterparty" className="w-full max-w-full break-words overflow-hidden"><SelectValue placeholder="Выберите контрагента" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no-counterparty">Без контрагента</SelectItem>
              {counterparties.map((cp) => (
                <SelectItem key={cp.id} value={cp.id}>{cp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

        <div className="space-y-2">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea 
            id="comment" 
            placeholder="Добавьте заметку о транзакции..." 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            rows={3}
            className="w-full max-w-full resize-none break-words whitespace-pre-wrap overflow-hidden"
          />
        </div>

      <div className="flex gap-3 pt-4 w-full max-w-full">
        <Button type="submit" className="flex-1 max-w-full" disabled={isSubmitting}>{isSubmitting ? "Сохранение..." : transaction ? "Обновить транзакцию" : type === "transfer" ? "Выполнить перевод" : "Сохранить транзакцию"}</Button>
        {onCancel && (<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-shrink-0">Отмена</Button>)}
      </div>
    </form>
  )
}


